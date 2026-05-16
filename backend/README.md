# DayStack — Backend

Go REST API for a personal daily planning app. Manages weeks, days, and tasks with automatic schedule generation based on day type.

## API Endpoints Overview

```
GET    /health
GET    /api/weeks?offset=0
PATCH  /api/days/{id}
POST   /api/days/{id}/reset
POST   /api/days/{id}/tasks
PATCH  /api/tasks/{id}
DELETE /api/tasks/{id}
```

---

## API Endpoints Detail

### `GET /health`

Liveness check. Returns `ok` as plain text.

---

### `GET /api/weeks?offset=0`

Returns a week relative to the current week. `offset=0` (or omitted) is this week, `offset=-1` is last week, `offset=1` is next week. Creates the week and all 7 day records if they don't exist yet.

**Query parameter:** `offset` — integer, defaults to `0`.

**Examples:**
```
GET /api/weeks           → current week
GET /api/weeks?offset=-1 → last week
GET /api/weeks?offset=2  → two weeks from now
```

**Response:** `Week` object with nested `days` and their `tasks`.

```json
{
  "id": 1,
  "week_start": "2026-05-11",
  "days": [
    {
      "id": 1,
      "date": "2026-05-11",
      "day_type": "unset",
      "wake_time": "",
      "focus": "",
      "notes": "",
      "tasks": []
    }
  ]
}
```

---

### `PATCH /api/days/{id}`

Partial update on a day. Only fields present in the request body are changed — omitted fields are left untouched.

If `day_type` changes, template tasks for the old type are deleted and regenerated for the new type. Custom tasks are preserved across type changes.

**Request body** (all fields optional):
```json
{
  "day_type": "full",
  "wake_time": "08:00",
  "focus": "Ship the task input feature",
  "notes": ""
}
```

`day_type` must be one of: `"full"`, `"half"`, `"light"`, `"unset"`.

`wake_time` must be `HH:MM` (24-hour) or empty string.

**Response:** Updated `Day` object with all tasks.

**Status codes:**
- `200 OK`
- `400 Bad Request` — invalid body
- `404 Not Found` — day ID doesn't exist
- `500 Internal Server Error`

---

### `POST /api/days/{id}/reset`

Wipes a day back to its initial state: `day_type` → `"unset"`, `wake_time` → `""`, `focus` → `""`, `notes` → `""`, and deletes all tasks (both template and custom).

No request body required.

**Response:** Reset `Day` object (empty tasks array).

**Status codes:**
- `200 OK`
- `400 Bad Request` — invalid day ID
- `500 Internal Server Error`

---

### `POST /api/days/{id}/tasks`

Creates a custom task for a day. Custom tasks appear below template tasks and can be deleted individually. Template tasks cannot be deleted this way.

**Request body:**
```json
{
  "label": "Call the dentist"
}
```

`label` is required and max 120 characters (enforced on the frontend).

**Response:** Created `Task` object.

```json
{
  "id": 42,
  "label": "Call the dentist",
  "completed": false,
  "sort_order": 7,
  "source": "custom"
}
```

**Status codes:**
- `200 OK`
- `400 Bad Request` — missing or empty label
- `500 Internal Server Error`

---

### `PATCH /api/tasks/{id}`

Toggles or sets the `completed` field on a task. Works on both template and custom tasks.

**Request body:**
```json
{
  "completed": true
}
```

**Response:** Updated `Task` object.

**Status codes:**
- `200 OK`
- `400 Bad Request`
- `404 Not Found`
- `500 Internal Server Error`

---

### `DELETE /api/tasks/{id}`

Deletes a custom task. Template tasks are protected — attempting to delete one returns 404.

No request body required.

**Status codes:**
- `204 No Content` — deleted
- `400 Bad Request` — invalid task ID
- `404 Not Found` — task doesn't exist or is a template task
- `500 Internal Server Error`

---

## Data Models

```
Week
  id          int
  week_start  string  — "YYYY-MM-DD", always a Monday

Day
  id          int
  date        string  — "YYYY-MM-DD"
  day_type    string  — "full" | "half" | "light" | "unset"
  wake_time   string  — "HH:MM" or ""
  focus       string  — one-sentence intent for the day
  notes       string
  tasks       Task[]

Task
  id          int
  label       string
  completed   bool
  sort_order  int
  source      string  — "template" | "custom"
```

Template tasks are generated automatically when `day_type` is set and are reset whenever `day_type` changes. Custom tasks persist across type changes and can be deleted.

---

## Database Schema

Three tables. Weeks own days, days own tasks — cascading deletes all the way down.

```sql
-- 001_init.sql
CREATE TABLE weeks (
  id         SERIAL PRIMARY KEY,
  week_start DATE NOT NULL UNIQUE
);

CREATE TABLE days (
  id        SERIAL PRIMARY KEY,
  week_id   INTEGER REFERENCES weeks(id) ON DELETE CASCADE,
  date      DATE NOT NULL UNIQUE,
  day_type  VARCHAR(10) CHECK (day_type IN ('full','half','light','unset')) DEFAULT 'unset',
  wake_time VARCHAR(5),
  notes     TEXT
);

CREATE TABLE tasks (
  id         SERIAL PRIMARY KEY,
  day_id     INTEGER REFERENCES days(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,
  completed  BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0
);

-- 002_focus_and_custom_tasks.sql
ALTER TABLE days  ADD COLUMN IF NOT EXISTS focus  TEXT NOT NULL DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'template';
```

Migrations run automatically on every server boot via `db.RunMigrations`. All statements are idempotent — safe to re-run on an already-migrated database.

---

## Environment Variables

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/daystack?sslmode=disable
PORT=8080                              # optional, defaults to 8080
ALLOWED_ORIGIN=https://your-app.vercel.app  # optional, defaults to * in dev
```

---

## Local Development

**Run the server:**
```bash
cd backend
go run main.go
```

Migrations run automatically on startup. No manual setup needed beyond a running Postgres instance and a valid `DATABASE_URL` in `.env`.

**Verify it's up:**
```bash
curl http://localhost:8080/health
# → ok
```

---

## Stack

| | |
|---|---|
| Language | Go 1.26 |
| Router | chi v5 |
| Database | PostgreSQL via `lib/pq` |
| Config | godotenv (local), env vars (prod) |
| Deploy | Fly.io (DB: Supabase) |
