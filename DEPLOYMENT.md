# Deployment Guide

This walks you end-to-end through publishing the system to free hosting and
producing every URL the assessment asks for. Replace `YOUR_GH_USER`,
`YOUR_DOCKERHUB_USER`, and `YOUR_VERCEL_DOMAIN` with your own values as you go.

---

## 0. Prerequisites

- A GitHub account
- A Docker Hub account
- A Render account ([https://render.com](https://render.com)) — free tier is fine
- A Vercel account ([https://vercel.com](https://vercel.com)) — free tier is fine
- `git` and `docker` installed locally

---

## 1. Push the code to GitHub

```bash
# inside the repo root
git init -b main                              # already done if cloned
git add .
git commit -m "feat: initial inventory & order management system"

# create an empty repo named `inventory-management` on github.com first, then:
git remote add origin git@github.com:YOUR_GH_USER/inventory-management.git
git push -u origin main
```

**Submission item:** the GitHub URL  
`https://github.com/YOUR_GH_USER/inventory-management`

---

## 2. Build & push the backend image to Docker Hub

```bash
# Log in once
docker login

# Build (multi-platform optional; linux/amd64 is what Render runs)
docker build -t YOUR_DOCKERHUB_USER/inventory-backend:latest ./backend

# Smoke test locally
docker run --rm -p 8000:8000 \
  -e DATABASE_URL="sqlite:////tmp/quick.db" \
  YOUR_DOCKERHUB_USER/inventory-backend:latest
# in another terminal:  curl http://localhost:8000/health

# Push
docker push YOUR_DOCKERHUB_USER/inventory-backend:latest
```

If you want multi-arch (Apple Silicon + Render's linux/amd64), use buildx:

```bash
docker buildx create --use --name multi || true
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t YOUR_DOCKERHUB_USER/inventory-backend:latest \
  --push ./backend
```

**Submission item:** the Docker Hub URL  
`https://hub.docker.com/r/YOUR_DOCKERHUB_USER/inventory-backend`

---

## 3. Deploy the backend on Render (with PostgreSQL)

The repo ships [`render.yaml`](./render.yaml) which provisions **both** the
PostgreSQL database and the web service, wiring `DATABASE_URL` for you.

### Option A — One-click Blueprint (recommended)

1. On [Render](https://dashboard.render.com), click **New +** → **Blueprint**.
2. Connect your GitHub account and select the repo you just pushed.
3. Render reads `render.yaml`, shows the planned services, and asks you to
   create them. Click **Apply**.
4. The `inventory-db` PostgreSQL instance provisions first (free tier).
5. The `inventory-backend` service builds the Docker image, runs the
   container, and starts hitting `/health`. Wait for **Live**.
6. In the service's **Environment** tab, set `CORS_ORIGINS` to your Vercel
   URL once you have it (you can leave it empty for now; previews under
   `*.vercel.app` are already allowed via regex).

### Option B — Manual

1. **New +** → **PostgreSQL**. Free plan. Name it `inventory-db`. Copy its
   external `Internal Database URL`.
2. **New +** → **Web Service**. Connect the repo. Choose **Docker** as the
   runtime. Set **Root Directory** to `backend`. Set the health check path to
   `/health`. Add env vars:
   - `DATABASE_URL` — paste the Internal Database URL
   - `CORS_ORIGINS` — your Vercel domain, e.g. `https://your-app.vercel.app`
   - `LOW_STOCK_THRESHOLD` — `10`
3. Create the service. Wait for **Live**.

**Submission item:** the backend URL  
`https://inventory-backend.onrender.com` (or whatever Render assigns)

Smoke-check it:

```bash
curl https://inventory-backend.onrender.com/health
# {"status":"ok"}

curl https://inventory-backend.onrender.com/
# {"name":"Inventory & Order Management API","version":"1.0.0","docs":"/docs"}
```

> **Render free tier cold start:** the service sleeps after 15 min of
> inactivity. The first request after sleep takes ~30s. That's expected — hit
> `/health` once to warm it up before the interview.

---

## 4. Deploy the frontend on Vercel

1. Push your repo to GitHub (already done in step 1).
2. On [Vercel](https://vercel.com), click **Add New…** → **Project**.
3. Import the same GitHub repository.
4. **Configure** the project:
   - **Root Directory:** `frontend`
   - Framework: **Vite** (auto-detected)
   - Build command: `npm run build` (auto)
   - Output directory: `dist` (auto)
5. Under **Environment Variables**, add:
   - `VITE_API_URL` = your Render backend URL,
     e.g. `https://inventory-backend.onrender.com`

   This is a **build-time** variable — Vite bakes it into the bundle, so you
   must redeploy if you change it.
6. Click **Deploy**. After ~1 minute you get a URL like
   `https://inventory-management-yourname.vercel.app`.

The repo's [`frontend/vercel.json`](frontend/vercel.json) sets up the SPA
fallback rewrite so deep links (e.g. `/orders/1`) work directly.

**Submission item:** the frontend URL  
`https://YOUR_VERCEL_DOMAIN.vercel.app`

---

## 5. Wire the two services together (CORS)

Once Vercel gives you your frontend URL, set it in Render so the backend
accepts requests from it:

1. Render dashboard → your service → **Environment** tab.
2. Edit `CORS_ORIGINS` to be `https://YOUR_VERCEL_DOMAIN.vercel.app`
   (or comma-separated if you have multiple).
3. **Save** — Render restarts the service automatically.

The backend also matches `https://*.vercel.app` via regex, so Vercel preview
deployments work out of the box.

---

## 6. End-to-end verification

From your machine:

```bash
BACKEND=https://inventory-backend.onrender.com
FRONTEND=https://YOUR_VERCEL_DOMAIN.vercel.app

# 1. Backend liveness
curl -fsS "$BACKEND/health"

# 2. Create a product, a customer, then an order — checking the stock drops
curl -sS -X POST "$BACKEND/products" \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo Widget","sku":"DEMO-1","price":"9.99","quantity_in_stock":5}'

curl -sS -X POST "$BACKEND/customers" \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Demo User","email":"demo@example.com","phone":"+1-555-0100"}'

curl -sS -X POST "$BACKEND/orders" \
  -H "Content-Type: application/json" \
  -d '{"customer_id":1,"items":[{"product_id":1,"quantity":2}]}'

curl -sS "$BACKEND/products/1"   # quantity_in_stock should now be 3

# 3. Frontend
curl -fsS "$FRONTEND/" | head -20  # should return the SPA shell
open "$FRONTEND"                   # macOS;   xdg-open on Linux;   start on Win
```

Then in the browser, walk through:

1. **Dashboard** — sees the counts you just created.
2. **Products** — add / edit / delete.
3. **Customers** — add / delete.
4. **Orders** → **New order** — pick the customer, add line items, watch the
   live subtotal, submit. The order page should appear with the
   server-computed total and a decremented stock value back on the products
   page.

---

## 7. Final submission checklist

| Item                                    | Where to paste                                                            |
| --------------------------------------- | ------------------------------------------------------------------------- |
| GitHub repo (frontend + backend)        | `https://github.com/YOUR_GH_USER/inventory-management`                    |
| Backend Docker Hub image                | `https://hub.docker.com/r/YOUR_DOCKERHUB_USER/inventory-backend`          |
| Frontend hosted URL                     | `https://YOUR_VERCEL_DOMAIN.vercel.app`                                   |
| Backend API hosted URL                  | `https://inventory-backend.onrender.com`                                  |

---

## Troubleshooting

**Render build fails with `pg_isready`** — that's the Postgres image's
healthcheck, not the backend. Check the **Logs** tab of the `inventory-db`
service; usually it just needs another minute on the first deploy.

**CORS errors in the browser** — confirm `CORS_ORIGINS` on Render includes
*exactly* your Vercel URL (no trailing slash). Re-deploy if you change it.

**Vercel build succeeds but the page is blank** — open DevTools → Console.
Most often this means `VITE_API_URL` was not set at build time. Set it in
Vercel project settings and **redeploy** (Vite only embeds env vars at build,
not runtime).

**Render free Postgres connection refused** — Render's free Postgres needs
SSL. The connection string Render injects already has `?sslmode=require` and
our `app/core/database.py` normalises any `postgres://` prefix to the
SQLAlchemy 2 form `postgresql+psycopg://`.
