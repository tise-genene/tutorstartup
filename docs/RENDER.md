# Deploying to Render (Private Beta)

This repo is a pnpm + Turborepo monorepo:

- API: `apps/api` (NestJS + Prisma)
- Web: `apps/web` (Next.js)

This guide gets you to a **private beta** on Render:

- < 100 users
- manual support
- **no real money** (payments can stay disabled)

## What you will create in Render

1. **PostgreSQL** (managed database) — required
2. **API Web Service** — required
3. **Web Web Service** — required

Optional for later:

- Redis (managed) — for queue/cache/rate-limit persistence
- Meilisearch — for tutor search indexing at scale

For private beta you can run without Redis/Meilisearch by switching drivers to `memory`.

---

## Step 1 — Create a Render Postgres database

In Render:

- Create **PostgreSQL**
- Copy the **External Database URL** (Render shows it as a connection string)

You will paste that into the API service env var `DATABASE_URL`.

---

## Step 2 — Create the API service

Create a **Web Service** from your GitHub repo.

Recommended settings:

- **Environment**: Node
- **Node version**: 20+

### Build Command (API)

Use this:

`corepack enable && corepack prepare pnpm@10.13.1 --activate && pnpm install --frozen-lockfile && pnpm --filter api build`

Notes:

- `apps/api` has `postinstall: prisma generate`, so Prisma client is generated automatically during install.

### Start Command (API)

Use this:

`pnpm --filter api exec prisma migrate deploy && pnpm --filter api start:prod`

This ensures:

- migrations are applied
- the compiled NestJS server starts

### API environment variables (minimum)

Set these env vars in Render → API service → Environment:

Required:

- `NODE_ENV=production`
- `DATABASE_URL=<Render Postgres External URL>`
- `JWT_SECRET=<random 32+ chars>`
- `JWT_REFRESH_SECRET=<random 32+ chars>`
- `FRONTEND_URL=https://<your-web-service>.onrender.com`
- `API_PUBLIC_URL=https://<your-api-service>.onrender.com/api`
- `TRUST_PROXY=1`

Recommended for a real browser deployment:

- `AUTH_CSRF_ENABLED=true`

Disable infra you don’t want in beta:

- `QUEUE_DRIVER=memory`
- `CACHE_DRIVER=memory`
- `RATE_LIMIT_DRIVER=memory`
- `SEARCH_DRIVER=memory`
- `SEARCH_SYNC_ENABLED=false`

Optional (can be blank in beta):

- `RESEND_API_KEY=`
- `RESEND_FROM_EMAIL=`
- `GOOGLE_CLIENT_ID=`
- `GOOGLE_CLIENT_SECRET=`

### Health check

Your API should respond:

- `GET https://<api>.onrender.com/health/live`
- `GET https://<api>.onrender.com/health/ready`

---

## Step 3 — Create the Web service

Create another **Web Service** from the same repo.

### Build Command (Web)

`corepack enable && corepack prepare pnpm@10.13.1 --activate && pnpm install --frozen-lockfile && pnpm --filter web build`

### Start Command (Web)

`pnpm --filter web start:render`

### Web environment variables

Set:

- `NODE_ENV=production`
- `NEXT_PUBLIC_API_URL=https://<your-api-service>.onrender.com/api`

---

## Step 4 — Sanity test the deployed beta

1. Open the web URL in a browser.
2. Register a user.
3. Login → confirm you see your profile.
4. Refresh the page → confirm you stay logged in.

If refresh/login doesn’t persist, confirm:

- API `FRONTEND_URL` matches your web origin exactly
- API `TRUST_PROXY=1`
- You are using HTTPS URLs (Render default)

---

## Optional next upgrades (after beta)

- Add Render Redis and switch drivers:
  - `QUEUE_DRIVER=redis`
  - `CACHE_DRIVER=redis`
  - `RATE_LIMIT_DRIVER=redis`
  - `REDIS_URL=<render redis url>`
- Add Meilisearch and set:
  - `SEARCH_DRIVER=meilisearch`
  - `MEILISEARCH_HOST=...`
  - `MEILISEARCH_MASTER_KEY=...`
  - `SEARCH_SYNC_ENABLED=true`
