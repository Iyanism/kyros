# Kyros

A full-stack cold storage management platform — from intake manifest to slot allocation, dispatch, and GST invoice.

## 1. Introduction & Overview

### Why I built it

I once visited a cold storage facility and ended up walking into the chambers themselves — the cold is something you feel in your bones. I watched the whole operation unfold: orders being placed, executed, loaded and unloaded, and an admin team at their desks keeping all of it in sync. What struck me was how much of that coordination still lives in ledgers, chat messages, and manual double-checking.

Kyros is what came out of that visit. Am I building it for that facility? Yes and no — it would be great if they ever used it, but honestly this is my own project, something I chose to build because the domain interested me. It isn't a finished, bulletproof product yet; I'm still building and improving it, and I treat it as the place where I learn production-scale concerns for the first time.

### Architecture

A React SPA talks to a FastAPI backend over a small, consistent API surface. Every request carries a short-lived access token (with a refresh cookie behind it); the backend resolves the caller's role and, for client users, their tenant scope, before any query runs. The service layer owns business invariants — including the locking that keeps concurrent orders from claiming the same slots — and repositories talk to PostgreSQL through SQLAlchemy 2's async API. Alembic manages schema, and pytest runs against a separate, isolated test database.

```
React SPA (zustand auth, axios interceptors)
    │  Bearer access token + refresh cookie (withCredentials)
    ▼
FastAPI ── require_role / get_client_context   (RBAC + tenant scoping)
    │  router → service → repository
    ▼
PostgreSQL (SQLAlchemy 2 async · Alembic: 1 squashed init migration, 18 tables)
```

The operational flow the code implements:

```
login → inbound order → approve (reserve slots by temperature category)
      → palletise → allocate (slots become occupied)
      → outbound order → pick list → dispatch (stock movements + slots freed)
      → invoice (GST, PDF via reportlab) → payment (mock gateway adapter)
```

### Tech stack

- **Backend:** Python 3.14, FastAPI, SQLAlchemy 2 (async), psycopg, Alembic, PyJWT + Argon2, pydantic-settings, reportlab, uv
- **Frontend:** React 19, TypeScript, Vite 8 (React Compiler enabled), Tailwind CSS 4, react-router, zustand, zod, react-hook-form, recharts, Biome, pnpm
- **Data:** PostgreSQL
- **Testing:** pytest + pytest-asyncio (215 tests), ruff, Biome lint

## 2. Getting Started

### Prerequisites

- Git
- Python **3.14** and [uv](https://docs.astral.sh/uv/)
- Node.js 20+ and [pnpm](https://pnpm.io/)
- PostgreSQL 14+

### Clone

```bash
git clone git@github.com:Iyanism/kyros.git
cd kyros
```

### Environment

**API** — copy the template and fill in real values:

```bash
cp api/.env.example api/.env
```

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Main DB, e.g. `postgresql+psycopg://user:pass@localhost:5432/kyros` |
| `TEST_DATABASE_URL` | Separate DB used only by the test suite |
| `ACCESS_TOKEN_SECRET_KEY` / `REFRESH_TOKEN_SECRET_KEY` | Independent HS256 secrets — don't reuse one for both |
| `FACILITY_*`, `*_RATE`, `*GST_RATE` | Facility identity and billing rates used by invoice computation |

**Web** — the only variable is intentionally empty for local dev:

```bash
cp web/.env.example web/.env   # VITE_API_URL= → same-origin requests via the Vite dev proxy
```

### Database

```bash
createdb kyros
createdb kyros_test
```

### Run the API

```bash
cd api
uv sync
uv run alembic upgrade head
uv run python scripts/create_admin.py --email admin@example.com --password 'YourPass123!'
uv run uvicorn src.main:app --reload --port 8000
```

`scripts/create_admin.py` bypasses HTTP and calls the user service directly, so the password goes through the same Argon2 hashing path as everything else.

### Run the web app

```bash
cd web
pnpm install
pnpm dev
```

Open http://localhost:5173. In dev, `vite.config.ts` proxies `/auth`, `/clients`, `/inventory`, `/invoices`, … and the other API prefixes to `http://localhost:8000`, which keeps the refresh cookie first-party.

### Tests and checks

```bash
# Backend — 215 tests on TEST_DATABASE_URL
cd api && uv run pytest -q

# Frontend
cd web && pnpm lint && pnpm build
```

The test suite creates its schema once per session, wraps **every test in a SAVEPOINT that is rolled back on teardown**, and drops everything at the end — so tests never contaminate each other or your development data.

## 3. Core Technical Features & Engineering Insights

### Row-level locking for concurrent slot allocation

Slots are the contested resource: chambers → racks → slots, with a temperature category per chamber. If two operators approve inbound orders at the same time, naive queries would hand both the same physical slots.

The slot lifecycle is `available → reserved → occupied`, and I enforce it with Postgres row locks inside the per-request transaction:

- `SlotRepository.reserve_slots_for_temp` and `release_reserved_for_client` use `SELECT … FOR UPDATE SKIP LOCKED`, so concurrent approvers skip rows the other transaction already holds instead of blocking behind them.
- The real invariant lives in `InventoryService.allocate`: it first counts reserved slots per temperature category, then re-selects them under a strict `FOR UPDATE`, and raises `InventoryConflictError` if the locked count doesn't match what was planned. The pre-check is advisory; **only the locked re-check is authoritative** — that distinction was the core thing I had to internalize about concurrency.
- `get_db` in `src/core/database.py` commits on success and rolls back on exception, so a failed allocation leaves no half-reserved slots behind.

Trade-off: I deliberately used database-native locking rather than an application-level or distributed lock. There's one Postgres and no extra infrastructure to operate. If more tables ever need locking in a single transaction, I'd introduce an explicit lock ordering to stay deadlock-safe.

### Authorization at the dependency layer, not in the UI

Two primitives in `src/core/dependencies.py` carry the whole access model:

- `require_role(*allowed_roles)` guards write endpoints — admin/operator/client, checked on every request.
- `get_client_context` is injected into every scoped list endpoint. A `client` user's queries are filtered to their own `client_id`, and per-client routes return 403 when the path ID doesn't match the caller's context.

The frontend also hides navigation for roles that can't use a page, but I never treat that as security — the API assumes the UI is hostile.

Sessions are a hybrid I chose for a reason: Argon2id password hashing; two independent HS256 secrets (30-minute access, 7-day refresh); the refresh token in an httpOnly cookie; the access token in a persisted zustand store attached as a `Bearer` header. On a 401, the axios response interceptor in `apiClient.ts` calls a **single-flight** `refreshAccessToken()` (defined in `lib/api/auth.ts` so parallel 401s share one refresh call), retries the original request exactly once, and otherwise ends the session. Login/refresh endpoints are excluded from interception so bad credentials can't trigger a refresh loop.

### Contract-driven tests, and a seam for payments

The suite (215 tests, 16 files) includes role-matrix access tests — e.g. `test_write_role_access.py` and `test_client_scoped_access.py` — and `test_full_order_lifecycle.py`, which drives an order through every status transition end-to-end. This is what let me refactor the access model with confidence; a missing scope shows up as a red test, not a production leak.

For payments, `src/domains/payments/mock_razorpay.py` implements the same order-create / verify / refund shapes as the real Razorpay SDK. The invoicing flow works end-to-end today, and going live means replacing one module — the rest of the domain doesn't change.

### Challenges & trade-offs

- **My first codebase at this scale** (~9k lines of Python, ~16.5k of TS/TSX). Redundancy crept in — duplicate API wrappers, dead validators, stray `console.log`s. I did a dedicated audit pass: deleted unused wrappers like `get_client_invoices`, `get_client_payments` and `get_stock_movements_by_order`, removed dead validator modules, and rewired every consumer to the surviving paths. The router → service → repository layering is exactly what made that refactor mechanical instead of scary.
- **Concurrency was new to me.** The two-phase reserve-then-allocate flow is where I learned what `FOR UPDATE SKIP LOCKED` actually buys you, and why a count check *before* acquiring a lock is only a fast-path optimization.
- **PostgreSQL was new to me** (I'd used MySQL/SQL before). Beyond the async driver story, migration discipline was the lesson: I had accumulated small incremental Alembic revisions and squashed them into a single `initial_schema` while the schema was still moving — much cheaper to do that early than after twenty revisions.
- **Testing against a real database.** Giving tests their own `TEST_DATABASE_URL` with SAVEPOINT rollback isolation cost some upfront setup in `tests/conftest.py` and paid for itself immediately — parallel-safe tests, no shared state, no fear of running them.

### Takeaways

1. Enforce authorization where the data lives — a dependency on the endpoint survives every UI rewrite.
2. Keep business invariants next to the transaction that protects them; a service-level conflict error beats a silent double-booking.
3. Tests need their own database more than they need mocks. The isolation was worth far more than the setup cost.
4. Delete dead code the moment you notice it — it's the cheapest refactor you'll ever ship.
