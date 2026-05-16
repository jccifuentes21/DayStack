# Deploying DayStack

| Layer | Provider |
|---|---|
| Database | [Supabase](https://supabase.com) (PostgreSQL) |
| Backend | [Render](https://render.com) (Go API) |
| Frontend | [Vercel](https://vercel.com) (React/Vite) |

Deploy order: **Supabase → Render → Vercel → lock down CORS** on Render.

There is a small URL chicken-and-egg: Render needs your Vercel origin for CORS, and Vercel needs the Render API URL. Use `ALLOWED_ORIGIN=*` on Render until Vercel is live, then tighten it.

---

## 1. Supabase — Database

1. Sign in at [supabase.com](https://supabase.com) and create a **New project** (pick a region close to your Render region, e.g. US East).
2. Wait until the project finishes provisioning.
3. On the project home screen, click **Connect** (top of the page, not under Settings).
4. In the Connect panel:
   - **Type:** Postgres
   - **Method:** **Session pooler** (port `5432`) — **required for Render** (Render free tier cannot reach Supabase **Direct connection**, which uses IPv6)
   - **Format:** **URI**
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

**Do not use Direct connection** (`db.*.supabase.co`) on Render. You will see errors like `dial tcp [2600:...]:5432: network is unreachable` because that hostname resolves to IPv6.

Do not use **Transaction pooler** (port `6543`) for this app.

Keep the URI secret. You will set it as `DATABASE_URL` on Render.

DayStack only needs Postgres. You do not need Supabase API keys or client libraries for this deploy.

---

## 2. Render — Backend

### Option A — Dashboard (recommended first time)

1. Sign in at [render.com](https://render.com) (Hobby workspace is $0/month).
2. **New +** → **Web Service** → connect your `DayStack` GitHub repo.
3. Configure:

| Setting | Value |
|---|---|
| Name | `daystack-api` (or similar) |
| Region | Close to Supabase |
| Branch | `main` (or your default) |
| Root Directory | `backend` |
| Runtime | **Go** |
| Build Command | `go build -o server .` |
| Start Command | `./server` |
| Instance Type | **Free** |

4. **Environment** → add:

| Key | Value |
|---|---|
| `DATABASE_URL` | Your Supabase URI (see SSL note below) |
| `ALLOWED_ORIGIN` | `*` (temporary) |

Render injects `PORT` automatically; the app reads it from the environment.

5. **Create Web Service** and wait for the deploy. Logs should show:

```
migrations ok
listening on :<port>
```

6. Copy the service URL (e.g. `https://daystack-api.onrender.com`).

Verify:

```bash
curl https://daystack-api.onrender.com/health
# → ok
```

**Free tier behavior:** The service **spins down after 15 minutes** without traffic. The next request can take **~1 minute** to respond while it wakes up. Fine for a personal morning app; not ideal if you need instant API responses 24/7.

### Option B — Blueprint (`render.yaml`)

The repo includes a root `render.yaml`. In the Render dashboard: **New +** → **Blueprint** → select the repo. Set `DATABASE_URL` when prompted (mark as secret). Adjust the service name if needed.

### Troubleshooting DB connection

| Error | Fix |
|---|---|
| `dial tcp [2600:...]:5432: network is unreachable` | You used **Direct connection**. Switch `DATABASE_URL` on Render to **Connect → Session pooler** (IPv4). Redeploy. |
| SSL / certificate errors | Add `?sslmode=require` to the end of `DATABASE_URL`. |
| `password authentication failed` | Reset DB password in Supabase, update `DATABASE_URL` on Render. |

---

## 3. Vercel — Frontend

1. Go to [vercel.com](https://vercel.com) → **Add New Project**.
2. Import the `DayStack` GitHub repo.
3. Configure:

| Setting | Value |
|---|---|
| Framework Preset | Vite |
| Root Directory | `frontend` |

**Environment variables:**

```
VITE_API_URL = https://daystack-api.onrender.com
```

No trailing slash. Use your actual Render URL.

4. **Deploy**. Copy the production URL (e.g. `https://daystack.vercel.app`).

---

## 4. Lock down CORS

On Render → your web service → **Environment**:

```
ALLOWED_ORIGIN = https://daystack.vercel.app
```

Save. Render redeploys automatically. The API only accepts browser requests from that origin.

---

## Environment variables reference

### Backend (Render)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Supabase Postgres URI from **Connect** |
| `PORT` | No | Injected by Render at runtime |
| `ALLOWED_ORIGIN` | No | CORS origin. Defaults to `*` if unset. Set to your Vercel URL in prod. |

### Frontend (Vercel)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Full URL of the Render backend, no trailing slash |

---

## Redeployments

| Part | Trigger |
|---|---|
| Backend | Push to the connected branch; Render auto-deploys |
| Frontend | Push to the connected branch; Vercel auto-deploys |
| Migrations | Run on every backend boot. Add a file under `backend/db/migrations/` and redeploy Render |

---

## Custom domains (optional)

**Vercel:** Project → Settings → Domains. Update `ALLOWED_ORIGIN` on Render to match.

**Render:** Service → Settings → Custom Domains. Update `VITE_API_URL` on Vercel if the API hostname changes.

---

## Cost notes (personal app)

- **Supabase:** free tier for hosted Postgres (limits apply).
- **Render:** **Free** web service instance ($0 compute). Spins down when idle; **750 instance hours/month** per workspace while running. Not intended for production per Render, but fine for a personal tool. Outbound bandwidth and build minutes have monthly caps on Hobby.
- **Vercel:** hobby/free tier is usually enough for the static Vite frontend.

Do **not** use Render’s free Postgres for DayStack (it **expires after 30 days**). Supabase is the database.
