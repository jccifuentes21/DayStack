# Deploying DayStack

| Layer | Provider |
|---|---|
| Database | [Supabase](https://supabase.com) (PostgreSQL) |
| Backend | [Vercel](https://vercel.com) (Services — persistent Go server) |
| Frontend | [Vercel](https://vercel.com) (Services — React/Vite) |

Frontend and backend deploy as two services in **one Vercel project**, sharing one domain. Vercel routes requests under `/api` to the Go service (stripping the prefix before forwarding) and everything else to the frontend. There's no separate backend host, no CORS between them in production, and — unlike a free-tier host that spins down after idle time — the Go service stays warm as a persistent server, so no cron ping is needed to avoid cold starts.

Deploy order: **Supabase → Vercel**.

---

## 1. Supabase — Database

1. Sign in at [supabase.com](https://supabase.com) and create a **New project**.
2. Wait until the project finishes provisioning.
3. On the project home screen, click **Connect** (top of the page, not under Settings).
4. In the Connect panel:
   - **Type:** Postgres
   - **Method:** **Session pooler** (port `5432`)
   - **Format:** URI
5. Copy the connection string. Replace the placeholder password with your real **database password**.
   If you forgot it: **Project Settings** (gear) → **Database** → **Reset database password**, then copy the URI again from **Connect**.
6. Append SSL if the URI does not already include query params:

```
?sslmode=require
```

Example session pooler URI (yours will differ):

```
postgres://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
```

Keep the URI secret. You will set it as `DATABASE_URL` on Vercel.

DayStack only needs Postgres. You do not need Supabase API keys or client libraries for this deploy.

---

## 2. Vercel — Frontend + Backend

The repo root `vercel.json` defines two services:

```json
{
  "experimentalServices": {
    "web": { "entrypoint": "frontend", "routePrefix": "/" },
    "api": { "entrypoint": "backend/main.go", "routePrefix": "/api", "framework": "go" }
  }
}
```

1. Go to [vercel.com](https://vercel.com) → **Add New Project**.
2. Import the `DayStack` GitHub repo. Vercel should detect the **Services** setup from `vercel.json` automatically — if not, set the **Framework Preset** to **Services**.
3. Add the following environment variables **before the first deploy** (Vite bakes `VITE_*` vars in at build time):

| Key | Value |
|---|---|
| `DATABASE_URL` | Supabase session pooler URI, with `?sslmode=require` |
| `VITE_API_URL` | `/api` |

`ALLOWED_ORIGIN` does not need to be set in production — frontend and backend share an origin, so the browser never sends a cross-origin request. It's only useful locally if you run the Vite dev server against a separately-running backend (see below).

4. **Deploy**. Copy the production URL (e.g. `https://daystack.vercel.app`).

Verify:

```bash
curl https://daystack.vercel.app/api/health
# → ok
```

### Migrations

Migration SQL files are embedded into the Go binary at compile time (`//go:embed migrations/*.sql` in `backend/db/db.go`), so they run automatically on every backend boot regardless of Vercel's working directory. Add a file under `backend/db/migrations/` and redeploy to apply new migrations.

### Troubleshooting DB connection

| Error | Fix |
|---|---|
| SSL / certificate errors | Add `?sslmode=require` to the end of `DATABASE_URL`. |
| `password authentication failed` | Reset DB password in Supabase, update `DATABASE_URL` on Vercel. |

---

## Environment variables reference

### Backend (Vercel service `api`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Supabase Postgres URI from **Connect** |
| `PORT` | No | Injected by Vercel at runtime |
| `ALLOWED_ORIGIN` | No | CORS origin, only relevant for local dev against a mismatched frontend port |

### Frontend (Vercel service `web`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | `/api` in production; `http://localhost:8080` for local dev |

---

## Local Dev

1. Copy `backend/.env.example` to `backend/.env` and fill in a local `DATABASE_URL`.
2. Copy `frontend/.env.example` to `frontend/.env` (defaults to `http://localhost:8080`, no `/api` prefix — the local Go server registers routes at its root, not behind Vercel's `/api` routing).
3. Start the backend: `cd backend && go run .`
4. Start the frontend: `cd frontend && npm run dev`

---

## Redeployments

| Part | Trigger |
|---|---|
| Backend | Push to the connected branch; Vercel auto-deploys the `api` service |
| Frontend | Push to the connected branch; Vercel auto-deploys the `web` service |
| Migrations | Run on every backend boot. Add a file under `backend/db/migrations/` and redeploy |

---

## Custom domains (optional)

Project → Settings → Domains. Both services live under the same domain, so no CORS changes are needed when you add one.

---

## Cost notes (personal app)

- **Supabase:** free tier for hosted Postgres (limits apply).
- **Vercel:** Services is billed differently from standard serverless Functions — check current Vercel pricing for persistent Go services on your plan before relying on this for anything beyond a personal project. `experimentalServices` is, as the name implies, an experimental/beta feature and its config shape or pricing model may change.

Do **not** use Render's free Postgres for DayStack (it **expires after 30 days**) — Supabase is the database regardless of which backend host you use.
