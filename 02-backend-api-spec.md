# DayStack — Backend API Spec (Go)

## Project Structure

```
daystack-api/
├── main.go
├── db/
│   ├── db.go          # connection setup
│   └── migrations/
│       └── 001_init.sql
├── handlers/
│   ├── weeks.go
│   ├── days.go
│   └── tasks.go
├── models/
│   ├── week.go
│   ├── day.go
│   └── task.go
├── .env
└── go.mod
```

---

## Dependencies

```bash
go get github.com/go-chi/chi/v5
go get github.com/lib/pq
go get github.com/joho/godotenv
```

---

## Environment Variables (`.env`)

```env
DATABASE_URL=postgres://user:password@localhost:5432/daystack?sslmode=disable
PORT=8080
```

---

## CORS

Since frontend is on a different domain (Vercel), add CORS middleware in `main.go`:

```go
func corsMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
        if r.Method == "OPTIONS" {
            w.WriteHeader(http.StatusOK)
            return
        }
        next.ServeHTTP(w, r)
    })
}
```

In production, replace `*` with your actual Vercel domain.

---

## API Endpoints

### Base URL
- Dev: `http://localhost:8080`
- Prod: your Railway/Fly.io URL

---

### Weeks

#### `GET /api/weeks/current`
Returns the current week and all 7 days with their tasks.

**Response:**
```json
{
  "id": 1,
  "week_start": "2026-05-11",
  "days": [
    {
      "id": 1,
      "date": "2026-05-11",
      "day_type": "full",
      "wake_time": "08:00",
      "notes": "",
      "tasks": [
        { "id": 1, "label": "Phone down until after breakfast", "completed": true, "sort_order": 0 },
        { "id": 2, "label": "AlgoExpert — min 1 problem, target 2", "completed": false, "sort_order": 1 }
      ]
    }
  ]
}
```

**Logic:**
- Find the week row where `week_start = DATE_TRUNC('week', CURRENT_DATE)`
- If it doesn't exist, create it and create 7 empty day rows
- Return with all days and tasks joined

---

#### `GET /api/weeks/:week_start`
Returns a specific week by its Monday date (YYYY-MM-DD). Same response shape as above.

---

### Days

#### `PATCH /api/days/:id`
Update a day's type and/or wake time.

**Request body:**
```json
{
  "day_type": "full",
  "wake_time": "08:30",
  "notes": "Gym at 1pm"
}
```

**Logic:**
- Update the day row
- If `day_type` changed, delete existing tasks for this day and regenerate them based on the new type (see Task Generation below)
- Return updated day with new tasks

**Response:** Updated day object with tasks array.

---

### Tasks

#### `PATCH /api/tasks/:id`
Toggle or update a task.

**Request body:**
```json
{
  "completed": true
}
```

**Response:**
```json
{
  "id": 1,
  "label": "AlgoExpert — min 1 problem, target 2",
  "completed": true,
  "sort_order": 1
}
```

---

## Task Generation Logic (Server-Side)

When a day_type is set or changed, delete existing tasks and insert these:

```go
var taskTemplates = map[string][]string{
    "full": {
        "Phone down until after breakfast",
        "AlgoExpert — min 1 problem, target 2",
        "Personal project — min 30 min block",
        "Job applications — min 1 sent or 1 prep step",
        "15 min golf swing practice",
        "Protein — min 2 shakes",
    },
    "half": {
        "Phone down until after breakfast",
        "One focused deep work block before leaving",
        "15 min golf swing practice",
        "Protein — min 2 shakes",
    },
    "light": {
        "One small task (algo problem, application, or 30 min project)",
        "15 min golf swing practice",
        "Protein — min 1 shake",
    },
}
```

Insert each with `sort_order = index`, `completed = false`.

---

## Database Migrations

Run `db/migrations/001_init.sql` manually or via a simple migration runner:

```sql
CREATE TABLE IF NOT EXISTS weeks (
  id SERIAL PRIMARY KEY,
  week_start DATE NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS days (
  id SERIAL PRIMARY KEY,
  week_id INTEGER REFERENCES weeks(id) ON DELETE CASCADE,
  date DATE NOT NULL UNIQUE,
  day_type VARCHAR(10) CHECK (day_type IN ('full', 'half', 'light', 'unset')) DEFAULT 'unset',
  wake_time VARCHAR(5),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  day_id INTEGER REFERENCES days(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0
);
```

---

## Deployment (Railway)

1. Push Go code to GitHub
2. New Railway project → Deploy from GitHub repo
3. Add PostgreSQL plugin in Railway dashboard
4. Set `DATABASE_URL` env var (Railway provides this automatically if you use their Postgres plugin)
5. Set `PORT` — Railway injects `$PORT` automatically, so in `main.go` use:

```go
port := os.Getenv("PORT")
if port == "" {
    port = "8080"
}
http.ListenAndServe(":"+port, r)
```

---

## Health Check Endpoint

Add this so Railway knows the service is alive:

```go
r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
    w.Write([]byte("ok"))
})
```
