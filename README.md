# Stocky — Inventory & Order Management System

A full-stack, production-shape application for managing products, customers, and orders with strict inventory tracking. Built for the Software Engineer technical assessment.

**Stack** — Python · FastAPI · SQLAlchemy 2 · PostgreSQL · React 18 · Vite · Tailwind CSS · shadcn/ui · TanStack Query · React Hook Form + Zod · Docker · Docker Compose · Render · Vercel

---

## Highlights

**Correctness**

- **Strict no-oversell guarantee** — orders are created inside a transaction with `SELECT ... FOR UPDATE` (Postgres) AND a conditional `UPDATE products SET qty = qty - :n WHERE id = :id AND qty >= :n` compare-and-swap that works identically on PostgreSQL and SQLite. Proven by `test_concurrent_orders_do_not_oversell` (8 simultaneous orders for 1 unit → exactly one 201, seven 409s, never negative stock).
- **Race-safe cancellation** — `DELETE /orders/{id}` uses a compare-and-swap on the order row itself (`DELETE … WHERE id = :id` with `rowcount` check). Two concurrent cancels result in exactly one 204 and one 404 — stock is restored once, never doubled. Proven by `test_concurrent_delete_order_restores_stock_once`.
- **Server-trusted totals** — `total_amount` is computed from the product price snapshot at order time. The client cannot influence it (the `OrderCreate` schema does not declare the field; Pydantic silently drops anything the client sends).
- **Atomic stock decrement + restore** — `create_order` decrements via the CAS pattern, `delete_order` restores via guarded `UPDATE` only after winning the DELETE race.

**Security**

- **CORS pinned** — explicit allowlist + project-scoped regex for preview URLs only. No `*.vercel.app` wildcard.
- **Security headers on every response** — HSTS, X-Frame-Options=DENY, X-Content-Type-Options=nosniff, Referrer-Policy, CSP, Permissions-Policy.
- **Email/SKU enumeration closed** — 409 responses no longer echo the conflicting value (e.g. `"A record with the same email already exists."` not `"Email 'alice@example.com' already exists"`).
- **`/docs` gated by env var, default OFF** — operators opt in to Swagger exposure; default ships safe.
- **Uniqueness enforced at DB + application** — DB `UNIQUE` constraints on `products.sku` and `customers.email`, plus app-level pre-checks with friendly 409 responses. Email comparison is case-insensitive at the CRUD layer (proven by `test_duplicate_email_is_case_insensitive`).
- **DB-aware health check** — `/health` executes `SELECT 1` and returns 503 with a JSON detail on `SQLAlchemyError`. Used by Docker `HEALTHCHECK` and Render's `healthCheckPath`.

**Tests**

- **40 backend tests pass**, including:
  - The 8-thread concurrent-order CAS proof (no oversell under load).
  - The 4-thread concurrent-cancel CAS proof (no double-restore).
  - Email case-insensitivity, `/health` 503 path, 404 paths for missing-id GET/PUT/DELETE on every resource, PUT /customers/{id} happy/partial/conflict.

**Frontend**

- **Single design system** — every page and shell component renders through shadcn primitives. The legacy `@layer components` block (`.btn-*`, `.input`, `.label`, `.card`, `.badge*`, `.table-*`, `.skeleton`) is deleted; 18 dead shadcn primitives plus 15 unused `@radix-ui/*` peer deps are gone.
- **Foundation primitives** — `PageHeader`, `ErrorState`, `DataTable` (sortable + searchable + paginated + skeleton-loading + keyboard rows), `StatusBadge` (token-driven success/warn/info/danger). Used by every page.
- **Forms** — react-hook-form + Zod resolver, with shared `FormField` for label/control/error/hint. Schemas live in `frontend/src/schemas/` and mirror the backend Pydantic shapes.
- **Mutation hooks** — `useCreateProduct` / `useUpdateProduct` / `useDeleteProduct` etc. wrap `useMutation` with toast + cross-resource cache invalidation in one place. No 7× copy-pasted `useMutation({ onSuccess: toast.success + qc.invalidate })` blocks.
- **Centralized routes + query keys** — `lib/routes.js` and `lib/query-keys.js` are the single source of truth; sidebar + command palette + every `<Link>` consume them.

**Visual identity**

- Stocky brand mark (stacked cubes) consistent across `favicon.ico`, `apple-touch-icon.png` (180×180), `og.png` (1200×630), `favicon.svg`, `symbol.svg`, `wordmark.svg`. **All three raster assets exist on disk** — earlier `index.html` referenced them but they were missing.
- HSL CSS variable design system (light + full dark coverage) with Inter Variable + JetBrains Mono Variable, deliberate type scale, motion tokens (`out-expo`, `in-out-expo`), and animated `shimmer` keyframe wired into Skeleton.
- Time-of-day greeting on the Dashboard. Two real sparklines (Orders count + Revenue) computed client-side from `/orders` data — no fabricated trends. (The previous build's `synthRamp()` is gone.)
- Real notifications dropdown surfaces low-stock products with links to the product detail page. `prefers-reduced-motion` honored throughout (CSS + skeleton + framer-motion route transitions).
- A11y baseline: skip link, focus-visible rings on every interactive surface, ARIA labels on icon buttons, keyboard-clickable rows on the low-stock table, every form field with proper `<Label>` and inline `role="alert"` error messages.

**Production-ready containers**

- Multi-stage backend Dockerfile (`python:3.12-slim` builder → slim runtime), non-root user `appuser` (uid 1001), `apt --no-install-recommends`, layer-cached deps, container `HEALTHCHECK` hitting `/health`.
- Multi-stage frontend Dockerfile (`node:20-alpine` builder → `nginx:alpine` runtime) with SPA fallback rewrite.
- `docker-compose.yml` orchestrates `db` + `backend` + `frontend` with named volumes for Postgres persistence, env-driven credentials (no hardcoded secrets), and healthcheck-gated startup ordering.

---

## Repository layout

```
.
├── backend/                       # FastAPI + SQLAlchemy 2 + PostgreSQL
│   ├── app/
│   │   ├── core/                  # config, database, exceptions
│   │   ├── crud/                  # business logic
│   │   │   ├── _helpers.py        # commit_or_409 — shared try/IntegrityError/rollback
│   │   │   ├── products.py
│   │   │   ├── customers.py       # PUT support; case-insensitive email lookup
│   │   │   └── orders.py          # atomic CAS for stock + cancellation
│   │   ├── models/                # SQLAlchemy 2 mapped-style ORM
│   │   ├── schemas/
│   │   │   ├── _validators.py     # shared StrippedStr / _strip
│   │   │   ├── order.py           # OrderStatus enum (pending/confirmed/cancelled)
│   │   │   └── …
│   │   ├── routers/               # GET/POST/PUT/DELETE + typed list[X] returns
│   │   └── main.py                # app factory, CORS, SecurityHeaders middleware
│   ├── tests/                     # pytest — 40 tests
│   │   ├── test_orders.py         # incl. 8-thread CAS + 4-thread cancel-race
│   │   ├── test_customers.py      # incl. case-insensitive email + PUT
│   │   ├── test_products.py
│   │   └── test_dashboard.py      # incl. /health 503 path
│   ├── Dockerfile                 # multi-stage, non-root, healthcheck
│   ├── requirements.txt
│   └── requirements-dev.txt       # + ruff, pip-audit
├── frontend/                      # React + Vite + Tailwind + shadcn
│   ├── public/                    # favicon.ico, favicon.svg, apple-touch-icon.png, og.png, …
│   ├── src/
│   │   ├── api/                   # axios client + per-resource modules
│   │   ├── components/
│   │   │   ├── ui/                # shadcn primitives (14 — all consumed)
│   │   │   ├── forms/             # FormField, ProductForm, CustomerForm
│   │   │   ├── layout/            # AppShell · TopBar · Sidebar · CommandPalette
│   │   │   ├── DataTable.jsx      # sortable + searchable + paginated table
│   │   │   ├── PageHeader.jsx
│   │   │   ├── ErrorState.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── ConfirmDialog.jsx  # AlertDialog-based with danger variant
│   │   │   └── …
│   │   ├── hooks/                 # use-products.js · use-customers.js · use-orders.js
│   │   ├── lib/
│   │   │   ├── routes.js          # ROUTES + NAV_ITEMS + NAV_GROUPS
│   │   │   ├── query-keys.js      # TanStack Query key factories
│   │   │   ├── utils.js           # cn()
│   │   │   └── format.js
│   │   ├── pages/
│   │   ├── schemas/               # Zod schemas for forms
│   │   └── index.css              # HSL tokens (light + dark + brand tonal scale)
│   ├── Dockerfile                 # multi-stage → nginx
│   ├── nginx.conf                 # SPA fallback
│   ├── vercel.json                # SPA rewrite
│   └── tailwind.config.js
├── docker-compose.yml
├── render.yaml                    # Render blueprint
├── .env.example
├── .gitattributes                 # `* text=auto eol=lf`
├── ARCHITECTURE.md                # design-system + concurrency + test strategy
├── DEPLOYMENT.md                  # step-by-step deploy guide
└── README.md
```

---

## Quick start with Docker Compose (recommended)

Prerequisites: **Docker** and **Docker Compose v2**.

```bash
git clone <YOUR_GITHUB_REPO_URL>
cd <repo>
cp .env.example .env             # edit if you want to change defaults
docker compose up --build

# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
# API docs: http://localhost:8000/docs   (only if DOCS_ENABLED=true)
```

Tear down (preserving the database volume):

```bash
docker compose down
```

Wipe the database too:

```bash
docker compose down -v
```

---

## Local development without Docker

### Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt

# DATABASE_URL defaults to ./dev.db (SQLite) — no Postgres needed for dev.
# To use Postgres locally:
#   export DATABASE_URL="postgresql+psycopg://inventory:inventory@localhost:5432/inventory_db"

# Recommended for dev: expose /docs
export DOCS_ENABLED=true

uvicorn app.main:app --reload --port 8000
```

Run the tests:

```bash
cd backend
pytest -v
# 40 passed
```

Format + lint:

```bash
cd backend
ruff format app tests
ruff check app tests
```

### Frontend

```bash
cd frontend
npm install
echo 'VITE_API_URL=http://localhost:8000' > .env.local
npm run dev
# http://localhost:5173
```

---

## API reference

All endpoints return JSON. Error responses always have the shape `{"detail": "<message>"}`. Validation errors return `422` with Pydantic's standard issue list.

### Products

| Method | Path             | Description                                   |
| ------ | ---------------- | --------------------------------------------- |
| POST   | `/products`      | Create a product (409 on dup SKU)             |
| GET    | `/products`      | List all products                             |
| GET    | `/products/{id}` | Fetch one product (404 on missing)            |
| PUT    | `/products/{id}` | Update product fields (404 / 409 as needed)   |
| DELETE | `/products/{id}` | Delete a product (404 on missing)             |

### Customers

| Method | Path              | Description                                  |
| ------ | ----------------- | -------------------------------------------- |
| POST   | `/customers`      | Create a customer (409 on dup email)         |
| GET    | `/customers`      | List all customers                           |
| GET    | `/customers/{id}` | Fetch one customer (404 on missing)          |
| PUT    | `/customers/{id}` | **Partial update** — only sent fields touched |
| DELETE | `/customers/{id}` | Delete a customer (404 on missing)           |

Email comparison is **case-insensitive** at the CRUD layer: `JANE@x.com` collides with `jane@x.com`.

### Orders

| Method | Path           | Description                                                                |
| ------ | -------------- | -------------------------------------------------------------------------- |
| POST   | `/orders`      | Create an order — atomically decrements stock                              |
| GET    | `/orders`      | List orders with items + customer (selectinload eager)                     |
| GET    | `/orders/{id}` | Fetch one order with items + customer                                      |
| DELETE | `/orders/{id}` | Cancel an order — atomic DELETE-CAS, restores stock exactly once           |

### Dashboard / Health

| Method | Path         | Description                                              |
| ------ | ------------ | -------------------------------------------------------- |
| GET    | `/dashboard` | Counts + low-stock products (below threshold)            |
| GET    | `/health`    | `{"status":"ok"}` after `SELECT 1`; **503** on DB failure |

---

## Business rules

| Rule | Where enforced |
|---|---|
| Product SKU must be unique | DB `UNIQUE` + `commit_or_409` helper (`crud/_helpers.py`) |
| Customer email must be unique (case-insensitive) | DB `UNIQUE` + `func.lower()` lookup in `crud/customers.py` |
| `quantity_in_stock` cannot be negative | Pydantic `Field(ge=0)` + DB `CHECK` |
| Cannot order more than available stock | Atomic `UPDATE … WHERE qty >= :n` CAS (`crud/orders.py`) |
| Creating an order decrements stock per line item | Same atomic CAS inside the transaction |
| `total_amount` is computed server-side from current product prices | `crud/orders.py` — schema doesn't accept `total_amount` from client |
| Cancelling an order restores stock atomically and exactly once | `DELETE FROM orders WHERE id = :id` + `UPDATE products SET qty += n` |
| All errors use proper HTTP status codes (400/404/409/422) | `BusinessError` hierarchy + Pydantic |

---

## Tests

```bash
cd backend
pytest -v
# 40 passed
```

The suite covers happy paths, error paths, validation, **and two concurrency proofs**:

- `test_concurrent_orders_do_not_oversell` — 8 simultaneous orders for 1 unit. Exactly one 201, seven 409s. Proves the stock-decrement CAS.
- `test_concurrent_delete_order_restores_stock_once` — 4 simultaneous cancels of the same order. Exactly one 204, three 404s. Proves the cancel CAS. Stock is restored once, never doubled.

Plus targeted coverage for: insufficient stock, server-trusted total, server-ignored client-supplied total, email case-insensitivity, `/health` 503 path, 404 paths for missing-id GET/PUT/DELETE on every resource, PUT /customers happy/partial/conflict/404.

---

## What's new in this revision

The deliverable was rebuilt around three goals: **correctness gaps → closed**, **two design systems → one**, and **honest visual identity → no fake telemetry, no broken brand refs**.

Backend
- `delete_order` now uses DELETE compare-and-swap on the order row (works on Postgres AND SQLite; the prior FOR-UPDATE approach allowed double-restore on SQLite).
- `commit_or_409` extracts the IntegrityError boilerplate (was duplicated 5×).
- Shared `_strip` validator across all schemas; `OrderStatus` enum replaces magic strings.
- `docs_enabled` defaults to `False` (operator opts in). Hardcoded Vercel project name removed from the CORS regex default.
- Email/SKU enumeration in 409 bodies closed.
- 10 new tests (count: 30 → 40).
- Type-hinted router returns (`list[ProductRead]` etc.).
- `ruff` + `pip-audit` added to dev deps.

Frontend
- Foundation primitives shipped (`PageHeader`, `ErrorState`, `DataTable`, `StatusBadge`, `NativeSelect`, `FormField`) consumed by every page.
- Every page migrated to shadcn primitives + react-hook-form + zod. The legacy `@layer components` block deleted from `index.css`.
- Mutation hooks centralize toast + cache invalidation. Routes + query keys live in one file each.
- 18 dead shadcn primitives + 15 unused `@radix-ui` packages + `date-fns`/`vaul`/`react-day-picker` removed.
- Brand raster assets (`favicon.ico`, `apple-touch-icon.png`, `og.png`) generated and shipped — `index.html` references no longer 404.
- Dashboard time-of-day greeting + real Revenue sparkline (no more `synthRamp`). TopBar avatar uses the brand mini-mark; notifications surface real low-stock alerts.
- Dark-mode token completion + brand tonal scale `.dark` overrides; shimmer skeletons.

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for the decisions behind each.

---

## Deployment

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for the complete step-by-step guide covering:

1. Pushing to GitHub
2. Building and pushing the backend image to Docker Hub (incl. multi-arch with `buildx`)
3. Deploying the backend + PostgreSQL on Render (free tier) via `render.yaml`
4. Deploying the frontend on Vercel (free tier) via `vercel.json`
5. Wiring production environment variables (CORS, `VITE_API_URL`, `DOCS_ENABLED`)
6. End-to-end verification with `curl`

---

## Environment variables

See [`.env.example`](.env.example) for the full list. Highlights:

| Variable              | Default                                       | Notes |
| --------------------- | --------------------------------------------- | ----- |
| `DATABASE_URL`        | `sqlite:///./dev.db`                          | Docker Compose sets this to the `db` service automatically. Render injects this from the blueprint. |
| `CORS_ORIGINS`        | `http://localhost:5173,http://localhost:3000` | Comma-separated. Add your deployed frontend origin in production. |
| `CORS_ORIGIN_REGEX`   | empty                                         | Optional regex for ephemeral preview URLs. Must be project-scoped — never `.*\.vercel\.app$`. |
| `DOCS_ENABLED`        | `false`                                       | `/docs` and `/redoc` are opt-in. Off by default. Set to `true` in dev for the Swagger UI. |
| `LOW_STOCK_THRESHOLD` | `10`                                          | Products below this value appear in the dashboard's low-stock list and the TopBar notifications dropdown. |
| `VITE_API_URL`        | `http://localhost:8000`                       | **Build-time** for the frontend — rebuild if you change it. |

---

## License

Provided as part of a job-application technical assessment.
