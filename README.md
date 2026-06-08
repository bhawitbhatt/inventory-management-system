# Inventory & Order Management System

A full-stack, production-ready application for managing products, customers, and orders with strict inventory tracking. Built for the Software Engineer technical assessment.

**Stack** — Python · FastAPI · SQLAlchemy 2 · PostgreSQL · React · Vite · Tailwind CSS · Docker · Docker Compose

---

## Highlights

- **Strict no-oversell guarantee** — orders are created inside a transaction with `SELECT ... FOR UPDATE` (PostgreSQL) plus a conditional `UPDATE products SET qty = qty - :n WHERE id = :id AND qty >= :n` compare-and-swap that works on both PostgreSQL and SQLite. The test suite proves this under 8 concurrent threads ([`test_concurrent_orders_do_not_oversell`](backend/tests/test_orders.py)).
- **Server-trusted totals** — `total_amount` is computed from the product price snapshot at order time. The client never gets to set it.
- **Uniqueness enforced at DB + application** — unique constraints on `products.sku` and `customers.email`, plus pre-flight checks with friendly 409 responses.
- **Atomic cancellation** — deleting an order restores stock with the inverse atomic UPDATE.
- **Production Dockerfiles** — multi-stage builds for both backend (Python builder → slim runtime) and frontend (Node builder → Nginx runtime), non-root user backend, healthchecks on both, slim base images.
- **Health checks** — `/health` endpoint verifies database connectivity (`SELECT 1`) and returns 503 on failure; container `HEALTHCHECK` and Render `healthCheckPath` wired up.
- **CORS configured** — explicit origins for local dev + project-scoped regex for Vercel preview deployments (only this app's previews are allowed, not the entire `*.vercel.app` namespace).
- **Security headers** — middleware sets HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, CSP, and Permissions-Policy on every response.
- **Clean responsive UI** — Tailwind-styled, mobile-friendly, with toast notifications, modals, confirmation dialogs, and live subtotal preview on the order creation page.
- **Tests pass** — 30/30 backend tests including the concurrency-correctness test.

---

## Repository layout

```
.
├── backend/                  # FastAPI + SQLAlchemy 2 + PostgreSQL
│   ├── app/
│   │   ├── core/             # config, database, exceptions
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic v2 schemas
│   │   ├── crud/             # business logic (incl. atomic stock decrement)
│   │   ├── routers/          # FastAPI routers
│   │   └── main.py           # app factory, CORS, lifespan, exception handlers
│   ├── tests/                # pytest suite (incl. concurrency test)
│   ├── Dockerfile            # python:3.12-slim, non-root, healthcheck
│   ├── .dockerignore
│   ├── requirements.txt
│   └── pytest.ini
├── frontend/                 # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── api/              # axios client + endpoint wrappers
│   │   ├── components/       # Layout, Modal, StatCard, …
│   │   ├── pages/            # Dashboard, Products, Customers, Orders, …
│   │   ├── lib/              # formatting helpers
│   │   ├── App.jsx           # router
│   │   ├── main.jsx          # bootstrap (Query, Router, Toast)
│   │   └── index.css         # Tailwind + component classes
│   ├── Dockerfile            # multi-stage build (node:20-alpine → nginx:alpine)
│   ├── nginx.conf            # SPA fallback + asset caching
│   ├── vercel.json           # Vercel deployment config (SPA rewrites)
│   ├── .dockerignore
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.js
├── docker-compose.yml        # db + backend + frontend services
├── render.yaml               # Render blueprint (one-click deploy)
├── .env.example              # environment variable template
├── .gitignore
├── DEPLOYMENT.md             # step-by-step deploy guide
└── README.md
```

---

## Quick start with Docker Compose (recommended)

Prerequisites: **Docker** and **Docker Compose v2**.

```bash
# 1. Clone the repo
git clone <YOUR_GITHUB_REPO_URL>
cd <repo>

# 2. Create your .env from the template
cp .env.example .env
# edit .env if you need to change the default credentials

# 3. Build and start everything
docker compose up --build

# 4. Open the app
#    Frontend: http://localhost:3000
#    Backend:  http://localhost:8000
#    API docs: http://localhost:8000/docs
```

To tear down (preserving the database volume):

```bash
docker compose down
```

To wipe the database too:

```bash
docker compose down -v
```

---

## Local development without Docker

### Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# DATABASE_URL defaults to a local sqlite file (./dev.db) — no Postgres required for dev.
# To use a real PostgreSQL instance, set DATABASE_URL accordingly:
#   export DATABASE_URL="postgresql+psycopg://inventory:inventory@localhost:5432/inventory_db"

uvicorn app.main:app --reload --port 8000
```

Run the tests:

```bash
cd backend
pytest -v
```

### Frontend

```bash
cd frontend
npm install
# Tell the dev server where the backend lives (defaults to http://localhost:8000)
echo 'VITE_API_URL=http://localhost:8000' > .env.local
npm run dev
# Open http://localhost:5173
```

---

## API reference

All endpoints return JSON. Error responses always have the shape `{"detail": "<message>"}`.
Validation errors return `422` with Pydantic's standard list-of-issues format.

### Products

| Method | Path             | Description                       |
| ------ | ---------------- | --------------------------------- |
| POST   | `/products`      | Create a product (409 on dup SKU) |
| GET    | `/products`      | List all products                 |
| GET    | `/products/{id}` | Fetch one product                 |
| PUT    | `/products/{id}` | Update product fields             |
| DELETE | `/products/{id}` | Delete a product                  |

Body for create / update:

```json
{
  "name": "Wireless Headphones",
  "sku": "WH-1000",
  "price": "199.99",
  "quantity_in_stock": 25
}
```

### Customers

| Method | Path              | Description                          |
| ------ | ----------------- | ------------------------------------ |
| POST   | `/customers`      | Create a customer (409 on dup email) |
| GET    | `/customers`      | List all customers                   |
| GET    | `/customers/{id}` | Fetch one customer                   |
| DELETE | `/customers/{id}` | Delete a customer                    |

Body for create:

```json
{
  "full_name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1-555-0100"
}
```

### Orders

| Method | Path           | Description                                       |
| ------ | -------------- | ------------------------------------------------- |
| POST   | `/orders`      | Create an order — atomically decrements stock     |
| GET    | `/orders`      | List orders with items + customer                 |
| GET    | `/orders/{id}` | Fetch one order with items + customer             |
| DELETE | `/orders/{id}` | Cancel an order — atomically restores stock       |

Body for create:

```json
{
  "customer_id": 1,
  "items": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 2, "quantity": 5 }
  ]
}
```

The response includes `total_amount` (server-computed), the customer object, and the line items each with `unit_price` (the snapshot at order time) and `line_total`.

### Dashboard

| Method | Path         | Description                                    |
| ------ | ------------ | ---------------------------------------------- |
| GET    | `/dashboard` | Counts and low-stock products (below threshold)|

Response:

```json
{
  "total_products": 12,
  "total_customers": 7,
  "total_orders": 23,
  "low_stock_threshold": 10,
  "low_stock_products": [
    { "id": 5, "sku": "WH-1000", "name": "…", "price": "…", "quantity_in_stock": 2, "created_at": "…", "updated_at": "…" }
  ]
}
```

### Health

`GET /health` → `{"status": "ok"}` (used by Docker healthchecks and Render).

Interactive API docs are auto-generated at `/docs` (Swagger UI) and `/redoc`.

---

## Business rules

| Rule                                                                | Where it is enforced                                                                  |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Product SKU must be unique                                          | DB `UNIQUE` constraint + application-level pre-check (`crud/products.py`)             |
| Customer email must be unique                                       | DB `UNIQUE` constraint + application-level pre-check (`crud/customers.py`)            |
| `quantity_in_stock` cannot be negative                              | Pydantic `Field(ge=0)` + DB `CHECK (quantity_in_stock >= 0)`                          |
| Cannot order more than the available stock                          | Pre-check + atomic `UPDATE ... WHERE qty >= :n` compare-and-swap (`crud/orders.py`)   |
| Creating an order decrements stock for each line item               | Same atomic UPDATE inside the order transaction                                       |
| `total_amount` is computed server-side from current product prices  | `crud/orders.py` — the schema does not accept `total_amount` from the client          |
| Cancelling an order restores stock                                  | `delete_order` issues `UPDATE products SET qty = qty + :n` and deletes the order      |
| All errors use proper HTTP status codes                             | `BusinessError` → 400/404/409/422 mapping in `main.py`                                |

---

## Tests

```bash
cd backend
pytest -v
```

The suite covers happy paths, error paths, validation, **and concurrency**:

- `test_concurrent_orders_do_not_oversell` spawns **8 simultaneous orders for 1 unit of stock** and asserts exactly one 201 and seven 409s — proving the compare-and-swap pattern.
- `test_order_uses_server_computed_total` proves the total is server-trusted.
- `test_delete_order_restores_stock` proves cancellation is the exact inverse of creation.

---

## Deployment

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for the complete step-by-step guide covering:

1. Pushing to GitHub
2. Building and pushing the backend image to Docker Hub
3. Deploying the backend + PostgreSQL on Render (free tier) via `render.yaml`
4. Deploying the frontend on Vercel (free tier) via `vercel.json`
5. Wiring the production environment variables together
6. Verifying with a few `curl` commands

---

## Environment variables

See [`.env.example`](.env.example) for the full list. Highlights:

| Variable              | Default                                       | Notes                                                       |
| --------------------- | --------------------------------------------- | ----------------------------------------------------------- |
| `DATABASE_URL`        | `sqlite:///./dev.db`                          | In Docker Compose it is set to the `db` service automatically. Render injects this when using the blueprint. |
| `CORS_ORIGINS`        | `http://localhost:5173,http://localhost:3000` | Comma-separated. A project-scoped regex (`CORS_ORIGIN_REGEX`) additionally allows this app's `*.vercel.app` preview URLs only. |
| `LOW_STOCK_THRESHOLD` | `10`                                          | Below this value, products appear in the dashboard alert.    |
| `VITE_API_URL`        | `http://localhost:8000`                       | Frontend build-time env — points the browser at the API.    |

---

## License

Provided as part of a job-application technical assessment.
