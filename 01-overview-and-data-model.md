# DayStack — Overview & Data Model

## What It Is
A personal daily planning app. You label each day of the week (Full / Half / Light), set a wake time, and the app generates a schedule and task checklist. Completion is tracked and persists across devices via a Go + PostgreSQL backend.

## Stack
| Layer | Tech |
|-------|------|
| Frontend | React + Vite |
| Backend | Go (net/http or chi router) |
| Database | PostgreSQL |
| Frontend Deploy | Vercel |
| Backend Deploy | Railway or Fly.io |

No auth. Single user. No login screen.

---

## Core Concepts

### Day Types
| Type | Meaning | Work Expectation |
|------|---------|-----------------|
| **Full** | No commitments, open runway | Deep work day. AlgoExpert first, then project, then applications. |
| **Half** | Sport, gym, or social eating into the day | One focused block before you leave. Don't try to work after if tired. |
| **Light** | Romy day or heavy social | One small thing only. Keep the streak alive. |

### Task List Per Day Type

**Full Day Tasks**
- [ ] Phone down until after breakfast
- [ ] AlgoExpert — min 1 problem, target 2
- [ ] Personal project — min 30 min block
- [ ] Job applications — min 1 sent or 1 prep step
- [ ] 15 min golf swing practice
- [ ] Protein — min 2 shakes

**Half Day Tasks**
- [ ] Phone down until after breakfast
- [ ] One focused deep work block before leaving
- [ ] 15 min golf swing practice
- [ ] Protein — min 2 shakes

**Light Day Tasks**
- [ ] One small task (1 application, review 1 algo problem, or 30 min project)
- [ ] 15 min golf swing practice
- [ ] Protein — min 1 shake

---

## Database Schema

### Table: `weeks`
Represents a calendar week.

```sql
CREATE TABLE weeks (
  id SERIAL PRIMARY KEY,
  week_start DATE NOT NULL UNIQUE  -- always Monday of that week
);
```

### Table: `days`
One row per day per week.

```sql
CREATE TABLE days (
  id SERIAL PRIMARY KEY,
  week_id INTEGER REFERENCES weeks(id) ON DELETE CASCADE,
  date DATE NOT NULL UNIQUE,
  day_type VARCHAR(10) CHECK (day_type IN ('full', 'half', 'light', 'unset')) DEFAULT 'unset',
  wake_time VARCHAR(5),  -- stored as "HH:MM" 24hr format e.g. "08:30"
  notes TEXT
);
```

### Table: `tasks`
One row per task per day. Tasks are generated server-side when a day_type is set.

```sql
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  day_id INTEGER REFERENCES days(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0
);
```

---

## Schedule Generation Logic (Frontend)

When the user sets a wake time, the frontend calculates block times using minute offsets. All times display in 12hr format.

### Full Day Schedule
| Block | Offset from wake |
|-------|-----------------|
| Morning runway (tidy, shower, breakfast) | +0 min |
| Deep work starts | +90 min |
| AlgoExpert block | +90 min → +90+60 min |
| Break | 10 min |
| Personal project block | continues |
| Lunch | ~+270 min (4.5hrs after wake) |
| Applications block | +60 min after lunch |
| You time / buffer | late afternoon |
| 15 min golf practice | flexible, before 8pm |

### Half Day Schedule
| Block | Offset from wake |
|-------|-----------------|
| Morning runway | +0 min |
| One deep work block | +90 min → +90+90 min |
| Leave for activity | user-defined departure time |
| Evening buffer | on return |

### Light Day Schedule
| Block | Offset from wake |
|-------|-----------------|
| Morning runway | +0 min |
| One small task | +90 min → +90+30 min |
| Rest of day | free |

---

## Seed Data (optional for dev)

Run this after migrations to pre-populate current week:

```sql
INSERT INTO weeks (week_start) VALUES (
  DATE_TRUNC('week', CURRENT_DATE)::DATE
);
```
