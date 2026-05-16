# DayStack — Frontend Spec (React + Vite)

## Project Structure

```
daystack-ui/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── api/
│   │   └── client.js       # all fetch calls in one place
│   ├── components/
│   │   ├── WeekView.jsx     # 7-day week grid
│   │   ├── DayCard.jsx      # single day — type selector, wake time, tasks
│   │   ├── TaskList.jsx     # checklist for a day
│   │   ├── ScheduleBlock.jsx # generated time blocks display
│   │   └── WeekNav.jsx      # prev/next week navigation
│   ├── hooks/
│   │   └── useWeek.js       # fetch + state for current week
│   └── utils/
│       └── schedule.js      # schedule generation logic (offset math)
├── .env
└── vite.config.js
```

---

## Environment Variables (`.env`)

```env
VITE_API_URL=http://localhost:8080
```

In production set this to your Railway backend URL in Vercel's environment settings.

---

## API Client (`src/api/client.js`)

```js
const BASE = import.meta.env.VITE_API_URL;

export async function getCurrentWeek() {
  const res = await fetch(`${BASE}/api/weeks/current`);
  return res.json();
}

export async function updateDay(id, payload) {
  const res = await fetch(`${BASE}/api/days/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function toggleTask(id, completed) {
  const res = await fetch(`${BASE}/api/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed }),
  });
  return res.json();
}
```

---

## Schedule Generation (`src/utils/schedule.js`)

Takes a wake time string ("08:30") and day type, returns an array of labeled time blocks.

```js
function addMinutes(base, mins) {
  const [h, m] = base.split(':').map(Number);
  const total = h * 60 + m + mins;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
}

function to12hr(time24) {
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
}

export function generateSchedule(wakeTime, dayType) {
  if (!wakeTime || dayType === 'unset') return [];

  const blocks = [];

  if (dayType === 'full') {
    blocks.push({ label: '🛏 Wake up & morning runway', time: to12hr(wakeTime), note: 'Tidy, shower, cook breakfast. Phone down.' });
    blocks.push({ label: '💻 AlgoExpert', time: to12hr(addMinutes(wakeTime, 90)), note: 'Min 1 problem, target 2' });
    blocks.push({ label: '🔨 Personal project', time: to12hr(addMinutes(wakeTime, 150)), note: 'Min 30 min' });
    blocks.push({ label: '🍽 Lunch', time: to12hr(addMinutes(wakeTime, 270)), note: '' });
    blocks.push({ label: '📄 Job applications', time: to12hr(addMinutes(wakeTime, 330)), note: 'Min 1 sent or 1 prep step' });
    blocks.push({ label: '⛳ Golf swing practice', time: to12hr(addMinutes(wakeTime, 390)), note: '15 min' });
    blocks.push({ label: '🎮 You time', time: to12hr(addMinutes(wakeTime, 420)), note: 'Earned rest' });
  }

  if (dayType === 'half') {
    blocks.push({ label: '🛏 Wake up & morning runway', time: to12hr(wakeTime), note: 'Tidy, shower, cook breakfast. Phone down.' });
    blocks.push({ label: '💻 Deep work block', time: to12hr(addMinutes(wakeTime, 90)), note: 'One focused block before you leave' });
    blocks.push({ label: '⛳ Golf swing practice', time: to12hr(addMinutes(wakeTime, 180)), note: '15 min — fit in before leaving if possible' });
    blocks.push({ label: '🏃 Activity / social', time: '—', note: 'Sport, gym, or plans' });
    blocks.push({ label: '🌙 Evening buffer', time: '—', note: 'Rest if tired. One small task if energy allows.' });
  }

  if (dayType === 'light') {
    blocks.push({ label: '🛏 Wake up & morning runway', time: to12hr(wakeTime), note: 'Tidy, shower, cook breakfast. Phone down.' });
    blocks.push({ label: '✅ One small task', time: to12hr(addMinutes(wakeTime, 90)), note: '30 min max — keep the streak alive' });
    blocks.push({ label: '⛳ Golf swing practice', time: to12hr(addMinutes(wakeTime, 130)), note: '15 min' });
    blocks.push({ label: '💚 Romy / free day', time: '—', note: 'No guilt. Light days are by design.' });
  }

  return blocks;
}
```

---

## Component Specs

### `App.jsx`
- Fetches current week on mount via `useWeek` hook
- Renders `WeekNav` + `WeekView`
- Passes week data and update handlers down as props

---

### `WeekView.jsx`
- Renders 7 `DayCard` components in a row (desktop) or stacked (mobile)
- Highlights today's card with a subtle border or accent
- Props: `days`, `onDayUpdate`, `onTaskToggle`

---

### `DayCard.jsx`
This is the core component. Each day card contains:

1. **Header:** Day name (Mon–Sun) + date
2. **Day type selector:** Three buttons — Full / Half / Light. Unset state shows them all greyed. Selected state highlights the active one.
3. **Wake time input:** Simple time input (`<input type="time">`). Only shows if day_type is set.
4. **Schedule blocks:** Rendered from `generateSchedule(wakeTime, dayType)`. Shows time + label + note.
5. **Task checklist:** Rendered from `TaskList`. Only shows if day_type is set.

**On day type change:**
- Call `updateDay(id, { day_type })` 
- Backend regenerates tasks and returns updated day
- Replace local state with response

**On wake time change:**
- Debounce 500ms, then call `updateDay(id, { wake_time })`
- Regenerate schedule blocks locally (no backend needed for this)

---

### `TaskList.jsx`
- Renders a `<ul>` of tasks with checkboxes
- On checkbox toggle: call `toggleTask(task.id, !task.completed)`
- Optimistically update local state, revert on error
- Completed tasks get a strikethrough style

---

### `ScheduleBlock.jsx`
Simple display component. Renders one block:
```
10:30 AM  💻 AlgoExpert
          Min 1 problem, target 2
```

---

### `WeekNav.jsx`
- Prev / Next week arrow buttons
- Displays current week range: "May 11 – May 17"
- On navigate: fetch `/api/weeks/:week_start` for that Monday
- If week doesn't exist yet, backend creates it

---

### `useWeek.js` Hook

```js
import { useState, useEffect } from 'react';
import { getCurrentWeek } from '../api/client';

export function useWeek() {
  const [week, setWeek] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentWeek().then(data => {
      setWeek(data);
      setLoading(false);
    });
  }, []);

  return { week, setWeek, loading };
}
```

---

## Responsive Layout

- **Desktop (>768px):** 7 cards in a horizontal grid. `grid-template-columns: repeat(7, 1fr)`
- **Mobile (<768px):** Single column stack. Today's card appears first (or pinned to top).

Today detection:
```js
const isToday = day.date === new Date().toISOString().split('T')[0];
```

---

## Deployment (Vercel)

1. Push React code to GitHub
2. Import repo in Vercel
3. Framework preset: **Vite**
4. Add env var: `VITE_API_URL=https://your-railway-url.railway.app`
5. Deploy — Vercel handles the rest

---

## PR Interrupt Rule (hardcoded reminder)

On the current day card, if it's a Full or Half day, show a small persistent banner:

> 📬 **PR email?** Handle it first, then return to your schedule.

This is a static UI element, not a backend feature.
