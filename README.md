# DayStack

Personal daily planning app. Label each day of the week (Full / Half / Light), set a wake time, and get a generated schedule + task checklist. Completion persists across devices.

## Stack

| Layer | Tech | Hosting |
|---|---|---|
| Backend | Go + chi router | Fly.io |
| Database | PostgreSQL | Supabase |
| Frontend | React + Vite | Vercel |

No auth. Single user.

## Repo structure

```
DayStack/
├── backend/
│   ├── main.go
│   ├── db/           # connection + migrations
│   ├── handlers/     # HTTP handlers (weeks, days, tasks)
│   └── models/       # Week, Day, Task structs
└── frontend/
    ├── src/
    │   ├── api/      # axios client
    │   ├── components/
    │   ├── hooks/    # useWeek
    │   ├── types/    # tygo-generated from Go structs
    │   └── utils/    # schedule generation
    └── index.html
```

## Running locally

### Backend

Requires Go 1.21+ and a running Postgres instance.

```bash
# Start Postgres via Docker (one-time)
docker run -d \
  --name daystack-db \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=daystack \
  -p 5432:5432 \
  postgres:16-alpine

# Copy env and fill in your values
cp backend/.env.example backend/.env

# Run (migrations execute automatically on boot)
cd backend && go run .
```

The API will be at `http://localhost:8080`. Hit `/health` to confirm it's alive.

### Frontend

```bash
cd frontend
cp .env.example .env   # set VITE_API_URL=http://localhost:8080
npm install
npm run dev
```

## API

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/weeks?offset=0` | Get (or create) a week. offset 0 = current, -1 = last week, etc. |
| `PATCH` | `/api/days/:id` | Update day_type / wake_time / focus. Regenerates tasks if type changes. |
| `POST` | `/api/days/:id/reset` | Wipe a day back to unset, clearing all tasks. |
| `POST` | `/api/days/:id/tasks` | Add a custom task to a day. |
| `PATCH` | `/api/tasks/:id` | Toggle task completed. |
| `DELETE` | `/api/tasks/:id` | Delete a custom task. |
| `GET` | `/health` | Liveness check. |

See `backend/README.md` for full endpoint documentation.

## Deploying

See `DEPLOY.md`.
