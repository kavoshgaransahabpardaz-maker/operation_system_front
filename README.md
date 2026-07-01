# BrokerAI Frontend

React + TypeScript SPA for the BrokerAI customs brokerage platform.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Architecture](#architecture)
- [Key Conventions](#key-conventions)
- [Pages & Features](#pages--features)
- [Adding a New Feature](#adding-a-new-feature)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

---

## Tech Stack

| Concern | Library | Version |
|---|---|---|
| Framework | React | 18 |
| Language | TypeScript | 5 |
| Build tool | Vite | 5 |
| Router | React Router | 6 |
| Server state | TanStack Query (React Query) | 5 |
| HTTP client | Axios | 1 |
| Forms | React Hook Form + Zod | 7 / 3 |
| UI primitives | Radix UI | various |
| Styling | Tailwind CSS | 3 |
| Icons | Lucide React | — |
| Toasts | Sonner | 1 |
| Dates | date-fns | 4 |

---

## Prerequisites

- **Node.js** ≥ 20 (`node -v`)
- **npm** ≥ 10 (`npm -v`)
- **Docker + Docker Compose** (for production or running the full backend stack locally)
- The backend (`operating_system_cb_back`) running on `http://localhost:8000`

---

## Project Structure

```
operating_system_cb_front/
├── src/
│   ├── api/                    # Axios API modules (one file per domain)
│   │   ├── client.ts           # Axios instance + auth/401 interceptors
│   │   ├── auth.ts             # /api/v1/auth/* endpoints
│   │   ├── documents.ts        # /api/v1/documents/* endpoints
│   │   ├── classifications.ts  # /api/v1/classifications/* endpoints
│   │   ├── emails.ts           # /api/v1/email/* endpoints
│   │   ├── shipments.ts        # /api/v1/shipments/* endpoints
│   │   ├── workspace.ts        # /api/v1/workspace/* endpoints
│   │   └── index.ts            # Barrel re-export — always import from '@/api'
│   │
│   ├── components/
│   │   ├── layout/             # AppShell, Sidebar, TopBar
│   │   ├── shared/             # StatusBadge, ConfidenceBadge, FileIcon,
│   │   │                       # EmptyState, Spinner, ReferenceChip
│   │   └── ui/                 # Low-level primitives (Button, Input, Dialog…)
│   │
│   ├── features/               # One folder per product domain
│   │   ├── auth/               # LoginPage, RegisterPage, ForgotPasswordPage,
│   │   │                       # ResetPasswordPage, AuthGuard
│   │   ├── dashboard/          # DashboardPage
│   │   ├── documents/          # DocumentListPage, DocumentDetailPage
│   │   ├── email/              # EmailConnectionsPage
│   │   ├── shipments/          # ShipmentListPage, ShipmentDetailPage
│   │   └── settings/           # UserManagementPage
│   │
│   ├── hooks/
│   │   ├── useCurrentUser.ts   # Fetches /auth/me, caches in React Query
│   │   └── useUpload.ts        # File upload with 50 MB guard + 409 handling
│   │
│   ├── lib/
│   │   ├── session.ts          # Single owner of localStorage token (read/write/clear)
│   │   ├── queryKeys.ts        # All React Query cache keys in one place
│   │   ├── constants.ts        # Label maps, color maps, MAX_FILE_BYTES
│   │   └── utils.ts            # cn(), formatBytes(), formatDate(), shortId(), slugify()
│   │
│   ├── types/
│   │   └── index.ts            # All TypeScript interfaces (User, Document, Shipment…)
│   │
│   ├── routes.tsx              # createBrowserRouter — all route definitions
│   ├── main.tsx                # React root, QueryClient setup, Toaster
│   └── index.css               # Tailwind base + CSS design tokens (HSL variables)
│
├── Dockerfile                  # Multi-stage: Node build → Nginx serve
├── nginx.conf                  # SPA routing + /api proxy + gzip + security headers
├── docker-compose.prod.yml     # Full production stack
├── deploy.sh                   # One-command deploy script
├── .env.prod.example           # Production secrets template
├── .env.example                # Local dev env template
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.app.json
```

---

## Local Development

### 1. Install dependencies

```bash
cd operating_system_cb_front
npm install
```

### 2. Start the backend

The frontend needs the backend API running. From the backend repo:

```bash
cd ../operating_system_cb_back
cp .env.example .env          # fill in values
docker compose up -d           # postgres, redis, minio
# run migrations
docker compose exec api alembic upgrade head
# start api + worker
docker compose up api worker
```

Or if you have a backend already running at `http://localhost:8000`, skip this step.

### 3. Configure environment

```bash
cp .env.example .env
```

`.env`:
```env
VITE_API_URL=http://localhost:8000
```

### 4. Start the dev server

```bash
npm run dev
```

Opens at **http://localhost:5173**

In dev mode, Vite proxies are not configured — the `VITE_API_URL` env var tells the Axios client where to reach the API directly. CORS must be enabled on the backend (it is, via `allow_origins=["*"]` in development).

### 5. Other scripts

```bash
npm run build      # TypeScript compile + Vite production build → dist/
npm run preview    # Preview the production build locally (port 4173)
npm run lint       # ESLint
```

---

## Environment Variables

All variables are prefixed `VITE_` so Vite exposes them to the browser bundle.

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | Dev only | `http://localhost:8000` | Backend base URL. Not needed in production (Nginx proxies `/api`). |

> **Production note:** Do not set `VITE_API_URL` in production builds. The Nginx config proxies `/api/*` to the backend container on the same host, so no URL is needed in the bundle.

---

## Architecture

### State management

No Redux or Zustand. Two layers:

1. **Server state** — TanStack Query. Every API response is cached and keyed via `src/lib/queryKeys.ts`. Mutations invalidate the affected keys on success.
2. **Auth token** — `localStorage` only, managed exclusively through `src/lib/session.ts`. The Axios interceptor reads from it per-request.

### Auth flow

```
1. User submits /login form
2. POST /api/v1/auth/login → { access_token }
3. session.setToken(access_token)       ← stored in localStorage
4. React Query's useCurrentUser() fetches /auth/me on every page load
5. Axios request interceptor attaches Bearer token automatically
6. On 401 → interceptor calls session.clearToken() + redirects to /login
7. Logout → session.clearToken() + queryClient.clear() + navigate('/login')
```

### Request lifecycle

```
Component
  → calls useQuery / useMutation (from @tanstack/react-query)
  → calls API function from @/api (e.g., documentsApi.list())
  → apiClient.get(url)         ← src/api/client.ts (Axios instance)
  → HTTP request with Authorization: Bearer <token>
  → response validated / returned
  → React Query caches result under queryKeys.*
```

### Route protection

`AuthGuard` (`src/features/auth/AuthGuard.tsx`) wraps all authenticated routes. It checks `session.hasToken()` synchronously — if no token exists, it redirects to `/login` before rendering any child route.

```tsx
// src/routes.tsx
{
  element: <AuthGuard />,
  children: [
    { element: <AppShell />, children: [ ...all authenticated routes ] }
  ]
}
```

### Isolation boundaries

These four files are the "single source of truth" — changing any concern only requires editing one file:

| File | Owns |
|---|---|
| `src/lib/session.ts` | localStorage key + token read/write/clear |
| `src/lib/queryKeys.ts` | All React Query cache key arrays |
| `src/api/index.ts` | API module exports (restructure `api/` without touching consumers) |
| `src/types/index.ts` | All domain TypeScript types |

---

## Key Conventions

### Imports

Always import from barrel files, never from individual files:

```ts
// ✅
import { documentsApi, authApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { Spinner, StatusBadge } from '@/components/shared';
import type { Document, Shipment } from '@/types';

// ❌
import { documentsApi } from '@/api/documents';
import { Spinner } from '@/components/shared/Spinner';
```

### Query keys

Always use `queryKeys.*` — never inline arrays:

```ts
// ✅
useQuery({ queryKey: queryKeys.document(id), ... })
queryClient.invalidateQueries({ queryKey: queryKeys.documents() })

// ❌
useQuery({ queryKey: ['document', id], ... })
```

### Token access

Never call `localStorage` directly — use `session`:

```ts
// ✅
import { session } from '@/lib/session';
session.getToken()
session.setToken(token)
session.clearToken()

// ❌
localStorage.getItem('access_token')
```

### Error handling in mutations

```ts
useMutation({
  mutationFn: ...,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.someKey });
    toast.success('Done');
  },
  onError: (e: AxiosError<{ detail?: string }>) => {
    toast.error(e.response?.data?.detail ?? 'Something went wrong.');
  },
})
```

### Status colors

Never use arbitrary Tailwind color classes for document/shipment status. Use the maps in `src/lib/constants.ts`:

```ts
import { DOC_STATUS_COLORS, SHIPMENT_STATUS_COLORS } from '@/lib/constants';
// StatusBadge component handles this automatically
```

---

## Pages & Features

### Public routes

| Route | Component | Notes |
|---|---|---|
| `/login` | `LoginPage` | Redirects to `/` if already logged in |
| `/register` | `RegisterPage` | Auto-slugifies org name |
| `/forgot-password` | `ForgotPasswordPage` | Shows reset token in dev |
| `/reset-password` | `ResetPasswordPage` | Reads `?token=` from URL |

### Authenticated routes

| Route | Component | Key behaviour |
|---|---|---|
| `/` | `DashboardPage` | Polls every 30s; upload dialog; quick actions |
| `/documents` | `DocumentListPage` | Filter tabs; drag & drop upload; status filter |
| `/documents/:id` | `DocumentDetailPage` | Polls every 10s while OCR pending; classification override; reassociate to shipment; duplicate warning |
| `/shipments` | `ShipmentListPage` | Filter by status |
| `/shipments/:id` | `ShipmentDetailPage` | Document table; activity log with icons; status change with confirm dialog |
| `/email` | `EmailConnectionsPage` | Add IMAP; sync now; disconnect with confirm |
| `/settings/users` | `UserManagementPage` | Admin only (403 for non-admins); inline role/active toggle |

### Polling behaviour

| Page | Interval | Condition |
|---|---|---|
| Dashboard | 30s | Always |
| Document Detail | 10s | Only while `status` is `ocr_pending` or `ocr_processing` |

---

## Adding a New Feature

1. **Add types** to `src/types/index.ts`
2. **Add API function** to the relevant `src/api/*.ts` file and re-export from `src/api/index.ts`
3. **Add query keys** to `src/lib/queryKeys.ts`
4. **Add constants** (labels, colors) to `src/lib/constants.ts` if needed
5. **Create feature page** in `src/features/<domain>/YourPage.tsx`
6. **Register route** in `src/routes.tsx`
7. **Add nav link** in `src/components/layout/Sidebar.tsx` if it needs navigation

---

## Production Deployment

### Architecture

```
Internet → :80 (Nginx inside frontend container)
                 ├── /            → React SPA (index.html)
                 ├── /assets/*    → hashed static files (1-year cache)
                 └── /api/*       → proxy_pass http://api:8000

Internal Docker network (brokerai):
  api      → postgres:5432
  api      → redis:6379
  api      → minio:9000
  worker   → postgres + redis + minio
  beat     → redis:6379
```

The SPA is built without a `VITE_API_URL` — Nginx proxies `/api` at the same origin, so no CORS issues and no hardcoded backend URL in the bundle.

### First deployment

```bash
# 1. Clone frontend repo onto your server
git clone <repo-url> operating_system_cb_front
cd operating_system_cb_front

# 2. Create .env.prod from the template
cp .env.prod.example .env.prod

# 3. Edit .env.prod — fill in all CHANGE_ME values
#    Generate SECRET_KEY:
python3 -c "import secrets; print(secrets.token_hex(32))"
#    Generate REDIS_PASSWORD:
python3 -c "import secrets; print(secrets.token_hex(16))"
#    Generate TOKEN_ENCRYPTION_KEY:
python3 -c "import base64, os; print(base64.b64encode(os.urandom(32)).decode())"

# 4. Deploy
./deploy.sh
```

The `deploy.sh` script:
- Pulls base images
- Builds frontend and backend images
- Waits for PostgreSQL to be healthy
- Runs Alembic migrations
- Starts all services

### Updates / redeploys

```bash
git pull
./deploy.sh          # uses cached Docker layers where possible
./deploy.sh --build  # force full rebuild
```

### TLS / HTTPS

The stack serves HTTP on port 80. For HTTPS, terminate TLS at the host level:

**Option A — Caddy (recommended, automatic certs):**
```
# /etc/caddy/Caddyfile
yourdomain.com {
    reverse_proxy localhost:80
}
```

**Option B — Host Nginx + Certbot:**
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

### Useful commands

```bash
# View live logs from all services
docker compose -f docker-compose.prod.yml logs -f

# View logs from a specific service
docker compose -f docker-compose.prod.yml logs -f api

# Restart a single service without downtime
docker compose -f docker-compose.prod.yml restart worker

# Open a shell inside the api container
docker compose -f docker-compose.prod.yml exec api bash

# Run a one-off migration
docker compose -f docker-compose.prod.yml exec api alembic upgrade head

# Scale workers (e.g. 3 instances)
docker compose -f docker-compose.prod.yml up -d --scale worker=3

# Stop everything (data volumes are preserved)
docker compose -f docker-compose.prod.yml down

# Stop and delete all data volumes (destructive!)
docker compose -f docker-compose.prod.yml down -v
```

### MinIO console

The MinIO web console runs on port 9001, bound to `127.0.0.1` only. Access via SSH tunnel:

```bash
ssh -L 9001:127.0.0.1:9001 user@yourserver
# then open http://localhost:9001 in your browser
```

---

## Troubleshooting

### `npm run dev` — cannot reach API

Check `VITE_API_URL` in `.env` matches the backend address. Make sure the backend is running:
```bash
curl http://localhost:8000/health
# expected: {"status":"ok"}
```

### Login redirects back to `/login` immediately

The `access_token` key in `localStorage` is missing or expired. Open DevTools → Application → Local Storage → clear `access_token` and log in again. If the backend returns 401 on `/auth/me`, the token is invalid.

### Uploads fail with 413

The backend or a proxy is rejecting the request body. The Nginx config sets `client_max_body_size 55m` which covers the 50 MB limit. If you have a host-level Nginx in front, set the same directive there.

### Docker build fails on `npm ci`

The `package-lock.json` is out of sync with `package.json`. Run `npm install` locally, commit the updated `package-lock.json`, then rebuild.

### `docker compose` says `service "api" depends on service "migrate"` not found

You're using the frontend `docker-compose.prod.yml` which references `../operating_system_cb_back` as the build context. Make sure both repos are cloned side-by-side:
```
parent/
  operating_system_cb_front/   ← you are here
  operating_system_cb_back/    ← backend must exist here
```

### Celery worker not processing tasks

```bash
# Check worker is alive
docker compose -f docker-compose.prod.yml exec worker \
  celery -A app.core.celery_app inspect active

# Check Redis is reachable from the worker
docker compose -f docker-compose.prod.yml exec worker \
  redis-cli -h redis -a "$REDIS_PASSWORD" ping
```
