# Architecture

This document records the decisions behind Stocky's current shape. It is a companion to [README.md](README.md) (capability surface) and [DEPLOYMENT.md](DEPLOYMENT.md) (publishing steps).

---

## Backend

### Why FastAPI + SQLAlchemy 2 + Pydantic 2

- FastAPI's dependency injection model lets us keep request-scoped SQLAlchemy sessions per handler without globals (`Depends(get_db)` in [`app/core/database.py`](backend/app/core/database.py)).
- SQLAlchemy 2's `Mapped[T]` + `mapped_column` style gives mypy/pyright a real grip on ORM types. Every model in [`app/models/`](backend/app/models/) uses it.
- Pydantic 2 with `ConfigDict(from_attributes=True)` produces fast schema validation and lets us use computed fields (e.g. `OrderItemRead.line_total`) and tight constraints (`Field(ge=0, le=100_000)` on order item qty to cap DoS-shaped payloads).

### Concurrency strategy

**Two distinct compare-and-swap (CAS) operations protect the inventory invariant** — that stock never goes negative and is never restored more than once per cancellation. Both work on PostgreSQL and SQLite identically (since `SELECT ... FOR UPDATE` is a no-op on SQLite, the CAS UPDATEs are the actual safety net).

**1. Stock decrement on order creation** — [`crud/orders.py:create_order`](backend/app/crud/orders.py)

```sql
UPDATE products
SET    quantity_in_stock = quantity_in_stock - :requested
WHERE  id = :pid AND quantity_in_stock >= :requested;
```

If two concurrent orders both pass the upfront stock check, exactly one's `UPDATE` will return `rowcount == 1`; the loser sees `rowcount == 0`, the transaction rolls back, and a 409 is raised. Products are locked in id-sorted order to prevent A↔B deadlocks under PostgreSQL row locks.

Proved by `test_concurrent_orders_do_not_oversell` (`backend/tests/test_orders.py`): 8 threads place orders for 1 unit; exactly one 201, seven 409s, final stock is 0.

**2. Order cancellation** — [`crud/orders.py:delete_order`](backend/app/crud/orders.py)

```sql
DELETE FROM orders WHERE id = :order_id;
-- if rowcount == 0 → 404 (someone else won), do NOT restore stock
-- if rowcount == 1 → restore stock per line item with sequential UPDATEs
```

The original implementation acquired a row lock with `SELECT … FOR UPDATE` and then issued the restore UPDATEs. On SQLite this allowed double-restore: both concurrent cancels passed the SELECT, both restored stock. The new pattern flips the order: the DELETE itself is the CAS gate. Only one caller's DELETE returns `rowcount == 1`; the loser hits `rowcount == 0`, rolls back, and raises 404 *before* touching any product row.

Proved by `test_concurrent_delete_order_restores_stock_once`: 4 threads cancel the same order; exactly one 204, three 404s, stock restored once.

### Schema + CRUD shape

- Schemas: `XBase` → `XCreate` / `XUpdate` (partial) / `XRead` (`from_attributes=True`).
- CRUD: `list_x`, `get_x`, `create_x`, `update_x`, `delete_x`. The `commit_or_409` helper in [`crud/_helpers.py`](backend/app/crud/_helpers.py) translates `IntegrityError` into a `ConflictError` *without echoing the conflicting value* (closes user-enumeration vector). The helper replaces 5 duplicated `try/commit/IntegrityError/rollback/raise` blocks.
- Validators: shared `_strip` + `StrippedStr` / `StrippedOptionalStr` Annotated types in [`schemas/_validators.py`](backend/app/schemas/_validators.py).
- `OrderStatus` enum in [`schemas/order.py`](backend/app/schemas/order.py) — `pending | confirmed | cancelled`. Stored as the lowercase string in the `orders.status` column; consumed by `crud/orders.py` instead of magic literals.

### Security middleware

[`app/main.py`](backend/app/main.py) layers:

1. `SecurityHeadersMiddleware` — sets HSTS, X-Frame-Options=DENY, X-Content-Type-Options=nosniff, Referrer-Policy, CSP, Permissions-Policy with `setdefault` (won't clobber existing).
2. `CORSMiddleware` — explicit allowlist (`settings.cors_origin_list`) + optional regex (`settings.cors_origin_regex`). Regex default is now **empty** — operator must set it explicitly for preview deploys, scoped to their project only. (The earlier hardcoded `inventory-management-system-ten-omega` default is gone.)

`docs_enabled` defaults to `False`. `/docs`, `/redoc`, and `/openapi.json` are `None` unless an operator opts in by setting `DOCS_ENABLED=true`. Why: the strict CSP would break the Swagger UI (it loads JS from `cdn.jsdelivr.net`). Operators choose: keep `/docs` off in prod, or relax CSP to allow the CDN.

### Test layout

[`backend/tests/conftest.py`](backend/tests/conftest.py) sets `DATABASE_URL` to a unique-per-process SQLite file **before** importing app modules. Each test gets a fresh schema via the `_reset_schema` autouse fixture.

40 tests total. Highlights beyond the two CAS proofs:

- `test_duplicate_email_is_case_insensitive` — pins the `func.lower()` lookup contract.
- `test_health_returns_503_when_db_unreachable` — overrides `get_db` with a session whose `execute()` raises `OperationalError`; asserts the 503 branch in [`routers/health.py`](backend/app/routers/health.py).
- `test_update_customer_*` — happy path + partial + email collision (409) + missing id (404).
- `test_*_missing_*_returns_404` — covers GET/PUT/DELETE for every resource.

---

## Frontend

### Why React + Vite + TanStack Query + RHF + Zod + shadcn

- Vite for fast dev rebuilds and small production bundles.
- TanStack Query for server-state caching + invalidation; chosen over Redux/Zustand because the app is mostly fetch-and-mutate, and Query already provides the loading/error/cache semantics.
- React Hook Form + Zod for forms — RHF for the uncontrolled inputs ergonomics, Zod for the schema as a runtime + design-time contract that mirrors the backend's Pydantic schemas.
- shadcn/ui for primitives (instead of MUI/Chakra) because it gives us copy-into-repo source we can theme via CSS variables. No CSS-in-JS, no opaque component library upgrades.

### Single design system

Two design systems used to coexist: a legacy `@layer components` block in `index.css` (`.btn-*`, `.input`, `.label`, `.card`, `.badge*`, `.table-*`, `.skeleton`) AND the shadcn primitives in `components/ui/`. Pages used the legacy classes; ~63% of shadcn primitives were dead.

The current state collapsed onto shadcn-only. The `@layer components` block is **deleted**. 18 shadcn primitives that became truly dead (no consumer post-migration) and their 15 `@radix-ui/*` peer deps were removed. Surviving primitives in [`src/components/ui/`](frontend/src/components/ui/): `alert-dialog`, `avatar`, `breadcrumb`, `button`, `card`, `command`, `dialog`, `dropdown-menu`, `input`, `label`, `sheet`, `skeleton`, `table`, `tooltip`.

### Foundation primitives

Built once, consumed everywhere — see [`src/components/`](frontend/src/components/):

| Primitive | Purpose | Replaces |
|---|---|---|
| `PageHeader` | Title + description + actions slot | 6× duplicated `<header>` patterns across pages |
| `ErrorState` | Inline error banner with optional `Retry` | 5× copy-pasted destructive `<div>` |
| `DataTable` | Sortable + searchable + paginated + skeleton-loading + keyboard rows | 4 different `<table>` variants (raw `.table-*` × 3 + shadcn `Table` × 1) |
| `StatusBadge` | Token-driven semantic badge (success/warn/info/danger/muted) | Hardcoded `bg-amber-500/15 text-amber-700` etc. in 3 places |
| `NativeSelect` | Styled native `<select>` with focus ring matching `Input` | Custom `<select className="input">` |
| `FormField` | Label + control + error/hint stack | Inline field markup in every form |

### Mutation hooks

[`src/hooks/use-products.js`](frontend/src/hooks/use-products.js), [`use-customers.js`](frontend/src/hooks/use-customers.js), [`use-orders.js`](frontend/src/hooks/use-orders.js) wrap `useMutation` once with:

- `toast.success(...)` on success
- `toast.error(extractError(err))` on failure (no PII leaks; uses the existing `api/client.js` helper)
- Cache invalidation for the resource AND `dashboardKeys` AND (for order mutations) `productKeys` — so KPIs and stock reflect immediately

Pages call `useCreateProduct().mutate(payload)` instead of a 9-line inline `useMutation({ mutationFn, onSuccess: toast+invalidate, onError: toast })` block (which was duplicated across 7 pages before).

### Routes + query keys

Single source of truth in [`src/lib/`](frontend/src/lib/):

- `routes.js` exports `ROUTES` (path constants), `NAV_ITEMS` (flat — used by `CommandPalette`), and `NAV_GROUPS` (sectioned — used by `Sidebar`).
- `query-keys.js` exports `productKeys` / `customerKeys` / `orderKeys` / `dashboardKeys` factories. Cross-resource invalidation now reads as `qc.invalidateQueries({ queryKey: dashboardKeys.all })` rather than a magic `['dashboard']` typed in eight files.

A new route or rename happens in one place, propagates everywhere.

### Form system

[`src/components/forms/`](frontend/src/components/forms/):

- `ProductForm.jsx` and `CustomerForm.jsx` are self-contained — they own their own footer buttons and only need `{ defaultValues, onSubmit, onCancel, busy }` from the parent.
- Schemas in [`src/schemas/`](frontend/src/schemas/) mirror the backend Pydantic constraints (name/sku/email/phone length + regex). Failing validation surfaces inline via `FormField`'s error slot; successful submit forwards to the matching mutation hook.
- `OrderNew` uses `useFieldArray` for dynamic line items. It does **not** pre-check stock client-side anymore (that duplicated the server's atomic CAS and raced with concurrent updates). Insufficient-stock 409 surfaces inline via `ErrorState` + toast; the form retains the user's input.

### Visual identity

- **Tokens**: HSL channels in `index.css` so Tailwind alpha math works (`hsl(var(--success) / 0.15)`). Full dark-mode coverage including `--success-foreground` / `--warn-foreground` / `--info-foreground` and a `--brand-50…950` tonal scale with `.dark` overrides (inverted lightness — same hue, mirrored L). `bg-brand-50` reads light teal in light mode and dark teal in dark mode without `dark:` variants at every callsite.
- **Typography**: Inter Variable + JetBrains Mono Variable (self-hosted via `@fontsource-variable`). `font-feature-settings: 'cv11', 'ss01'` for Inter's curved-1 and single-story-g stylistic sets. `font-feature-settings: 'zero' 1` for slashed-zero in monospace contexts.
- **Motion**: `out-expo` and `in-out-expo` easing tokens; `shimmer` keyframe wired into the `Skeleton` primitive. `prefers-reduced-motion` honored globally (CSS media query) and on the Skeleton specifically.
- **Brand mark**: stacked cubes symbol consistent across `favicon.ico` (multi-size 16/32/48), `apple-touch-icon.png` (180×180), `og.png` (1200×630 social card with wordmark + tagline + gradient), `favicon.svg`, `symbol.svg`, `wordmark.svg`. The raster assets are generated procedurally from the SVG sources via Pillow (no system ImageMagick required, no `sharp` runtime dep).

### Accessibility baseline

- Skip-link styled and visible on first Tab (`.skip-link` in `index.css`).
- `:focus-visible { outline: 2px solid hsl(var(--ring)); offset 2px }` global.
- Every form input pairs with a `<Label>` via `htmlFor` (the `FormField` component enforces this).
- Icon-only buttons carry `aria-label`. Status-only color is supplemented with text (every `StatusBadge` has a child string).
- Low-stock rows on the Dashboard are `role="link" tabIndex={0}` with Enter/Space handlers.
- Reduced-motion respected on framer-motion route transitions, `Skeleton` shimmer, and the global `@media (prefers-reduced-motion)` block.

---

## Deployment posture

`render.yaml` provisions PostgreSQL + the backend web service in one blueprint, wiring `DATABASE_URL` automatically. The `app/core/database.py` URL rewriter accepts `postgres://` (legacy Heroku-style) and `postgresql://` and normalizes both to `postgresql+psycopg://` (SQLAlchemy 2 form).

`vercel.json` rewrites `/*` to `/index.html` so deep links work for the SPA. `VITE_API_URL` is the only build-time env var the frontend needs; production builds bake the deployed backend URL into the bundle.

Multi-stage Dockerfiles (backend: python:3.12-slim builder → slim runtime, frontend: node:20-alpine builder → nginx:alpine runtime) keep the final image surface minimal. Backend container runs as uid 1001 (`appuser`) and ships a `HEALTHCHECK` curl against `/health` for orchestrator gating.

The full step-by-step is in [DEPLOYMENT.md](DEPLOYMENT.md).
