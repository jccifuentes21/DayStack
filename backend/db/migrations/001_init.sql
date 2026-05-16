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

CREATE INDEX IF NOT EXISTS idx_days_week_id ON days(week_id);
CREATE INDEX IF NOT EXISTS idx_tasks_day_id ON tasks(day_id);
