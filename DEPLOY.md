# Deploying DayStack

| Layer | Provider |
|---|---|
| Database | [Supabase](https://supabase.com) (PostgreSQL) |
| Backend | [Fly.io](https://fly.io) (Go API) |
| Frontend | [Vercel](https://vercel.com) (React/Vite) |

There is a small chicken-and-egg between URLs: Fly needs your Vercel origin for CORS, and Vercel needs the Fly API URL. Deploy in the order below: Supabase → Fly → Vercel → tighten CORS on Fly.

---

## 1. Supabase — Database

1. Sign in at [supabase.com](https://supabase.com) and **New project** (pick a region close to your Fly region).
2. Wait for the project to finish provisioning.
3. Open **Project Settings → Database**.
4. Under **Connection string**, choose **URI** and copy the **Direct connection** string (port `5432`).  
   Use this for the Go API: long-lived process, migrations on boot.
5. Replace `[YOUR-PASSWORD]` with the database password you set at project creation.

Example shape (yours will differ):

```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

or the direct host:

```
postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

Keep this secret. You will pass it to Fly as `DATABASE_URL` in the next step.

**Optional:** In **Database → Extensions**, you do not need anything extra for DayStack; plain Postgres is enough.

---

## 2. Fly.io — Backend

Install the [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/) and log in:

```bash
fly auth login
```

From the repo root:

```bash
cd backend
fly launch
```

When prompted:

- Use the existing `fly.toml` (or let Fly create one).
- **App name:** pick a unique name (e.g. `daystack-api`); update `app` in `fly.toml` if it changes.
- **Region:** same region family as Supabase when possible (e.g. `iad` for US East).
- **Postgres:** **No** (database is on Supabase).
- **Deploy now:** you can say **No** until secrets are set.

Set secrets (paste your Supabase URI for `DATABASE_URL`):

```bash
fly secrets set \
  DATABASE_URL='postgresql://postgres:...@db....supabase.co:5432/postgres' \
  ALLOWED_ORIGIN='*'
```

`ALLOWED_ORIGIN=*` is temporary until Vercel is live.

Deploy:

```bash
fly deploy
```

Watch logs:

```bash
fly logs
```

You should see:

```
migrations ok
listening on :8080
```

Your API URL is `https://<app-name>.fly.dev`. Verify:

```bash
curl https://<app-name>.fly.dev/health
# → ok
```

**Troubleshooting DB connection**

- Supabase requires SSL. If `lib/pq` fails to connect, append `?sslmode=require` to `DATABASE_URL`.
- If Fly cannot reach Supabase over IPv6, use Supabase’s **Session pooler** or **Transaction pooler** URI from the dashboard instead of direct, or enable IPv4 add-on on Supabase if needed.

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
VITE_API_URL = https://<app-name>.fly.dev
```

No trailing slash.

4. **Deploy**. Copy the production URL (e.g. `https://daystack.vercel.app`).

---

## 4. Lock down CORS

Back on Fly, set your real frontend origin:

```bash
fly secrets set ALLOWED_ORIGIN='https://daystack.vercel.app'
```

Fly restarts the app with the new secret. The API only accepts browser requests from that origin.

---

## Environment variables reference

### Backend (Fly secrets)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Supabase Postgres URI (direct connection recommended) |
| `PORT` | No | Set to `8080` in `fly.toml`; Fly injects it at runtime |
| `ALLOWED_ORIGIN` | No | CORS origin. Defaults to `*` if unset. Set to your Vercel URL in prod. |

### Frontend (Vercel)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Full URL of the Fly backend, no trailing slash |

---

## Redeployments

| Part | Trigger |
|---|---|
| Backend | `cd backend && fly deploy` (or push if you wired GitHub Actions later) |
| Frontend | Push to the connected branch; Vercel redeploys automatically |
| Migrations | Run on every backend boot. Add a file under `backend/db/migrations/` and redeploy Fly |

---

## Custom domains (optional)

**Vercel:** Project → Settings → Domains. Update `ALLOWED_ORIGIN` on Fly to match.

**Fly:** `fly certs add your-api.example.com` then follow the DNS instructions. Update `VITE_API_URL` on Vercel if the API hostname changes.

---

## Cost notes (personal app)

- **Supabase:** free tier includes a hosted Postgres project (limits apply; see their pricing page).
- **Fly.io:** pay-as-you-go; small VMs can stay cheap with `auto_stop_machines` (cold start on first request).
- **Vercel:** hobby/free tier is usually enough for a static Vite frontend.
