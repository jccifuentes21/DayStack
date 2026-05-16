---
name: DayStack
description: Personal daily planning tool. Zero friction between opening the app and starting the day.
colors:
  bg:          "oklch(13% 0.010 250)"
  surface:     "oklch(17% 0.010 250)"
  surface-2:   "oklch(21% 0.010 250)"
  border:      "oklch(26% 0.010 250)"
  text-1:      "oklch(93% 0.005 250)"
  text-2:      "oklch(62% 0.008 250)"
  text-3:      "oklch(42% 0.006 250)"
  accent:      "oklch(57% 0.170 145)"
  accent-bg:   "oklch(20% 0.050 145)"
  full:        "oklch(60% 0.170 145)"
  full-bg:     "oklch(19% 0.055 145)"
  half:        "oklch(68% 0.130 65)"
  half-bg:     "oklch(19% 0.050 65)"
  light:       "oklch(63% 0.120 220)"
  light-bg:    "oklch(19% 0.040 220)"
typography:
  display:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    letterSpacing: "0.06em"
    textTransform: "uppercase"
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
  mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 400
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
  pill: "99px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  day-type-full:
    backgroundColor: "{colors.full-bg}"
    textColor: "{colors.full}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  day-type-half:
    backgroundColor: "{colors.half-bg}"
    textColor: "{colors.half}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  day-type-light:
    backgroundColor: "{colors.light-bg}"
    textColor: "{colors.light}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  task-checkbox:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text-2}"
    rounded: "{rounded.sm}"
    size: "18px"
  task-checkbox-checked:
    backgroundColor: "{colors.accent-bg}"
    textColor: "{colors.accent}"
    rounded: "{rounded.sm}"
    size: "18px"
---

# Design System: DayStack

## 1. Overview

**Creative North Star: "The Zero Friction Day"**

DayStack exists at the intersection of a training log and a flight preflight check. You open it in the morning, configure once, and the rest of the day you're executing — not planning. The interface has one job: show you what you need, stay out of the way, and never require more than two taps to get there.

The system is dark because its user is. Not dark for aesthetics, not dark to feel like a tool — dark because light themes are friction, and this app eliminates friction by definition. Every surface is deep, slightly cool-tinted, and exactly one tone above its neighbor. Depth comes from tonal layering, not shadows.

Warmth enters through the accent palette: Steady Emerald for productive momentum, Focused Amber for half days, Clear Sky for rest days. These are working colors — not celebration colors. They mark state, not mood.

**Key Characteristics:**
- Dark-first, single theme. No toggle, no system preference detection. This is a personal tool.
- Tonal layering: background / surface / surface-2 / border — four steps, no shadows.
- One accent (Steady Emerald). Appears on today, active states, completed tasks.
- Day-type color only on indicators. Never backgrounds, never large surfaces.
- Geist sans for all UI text. Geist Mono strictly for times, dates, and numbers.
- Zero decoration. No icons for their own sake, no illustrations, no confetti.

## 2. Colors: The Zero Friction Palette

Dark, tonal, and deliberately restrained. Three functional color families plus a single accent.

### Neutral (base surfaces)
- **Near-black canvas** (`oklch(13% 0.010 250)`): Page background. Cool-tinted — never pure black. The slight blue-gray shift keeps it from feeling like a void.
- **Elevated surface** (`oklch(17% 0.010 250)`): Cards, panels, the day detail panel. One step above background.
- **Hover surface** (`oklch(21% 0.010 250)`): Hover states, nested surfaces, pressed states.
- **Subtle border** (`oklch(26% 0.010 250)`): Dividers, input borders, separators.

### Text
- **Primary** (`oklch(93% 0.005 250)`): Main content. Near-white with a minimal cool tint.
- **Secondary** (`oklch(62% 0.008 250)`): Labels, supporting info, day names, section headers.
- **Muted** (`oklch(42% 0.006 250)`): Placeholders, disabled text, helper text.

### Primary (accent)
- **Steady Emerald** (`oklch(57% 0.170 145)`): Today indicator, active day type, completed task checkmarks, the week strip's current-day pill. Used sparingly — its scarcity is the point.
- **Emerald surface** (`oklch(20% 0.050 145)`): Background tint behind accent elements. Never used alone.

### Day type indicators
- **Full — Emerald** (`oklch(60% 0.170 145)`) on **`oklch(19% 0.055 145)`**: Deep work days. Matches the accent family intentionally.
- **Half — Focused Amber** (`oklch(68% 0.130 65)`) on **`oklch(19% 0.050 65)`**: Half days. Warm, present, not alarming.
- **Light — Clear Sky** (`oklch(63% 0.120 220)`) on **`oklch(19% 0.040 220)`**: Rest days. Cool, spacious, low pressure.

**The One Accent Rule.** Steady Emerald appears on ≤10% of any screen. It marks today, active state, and completion — nothing else. If a new element wants the accent color, it must displace one of those three uses, not add a fourth.

**The Tonal Steps Rule.** Depth is expressed through tonal steps (background → surface → surface-2 → border), never through shadows. If you reach for `box-shadow`, stop and ask whether a background step solves it instead.

## 3. Typography

**UI Font:** Geist (300, 400, 500, 600 weights)
**Data Font:** Geist Mono (400, 500 weights)

**Character:** Geist is clean and purposeful without being cold. It was built for developer tooling, which is exactly what this is. Geist Mono is reserved strictly for anything time-related or numerical — it makes times feel like data, not copy.

### Hierarchy
- **Display** (500 weight, 13px, 0.06em tracking, uppercase): Section labels, day type badges, week nav. All caps because it's navigational data, not content.
- **Body** (400 weight, 15px, 1.5 line-height): Task labels, notes, schedule block descriptions. Main reading text.
- **Label** (500 weight, 13px): Day names (Mon, Tue), card headers, UI controls. Semi-bold to hold weight at small sizes.
- **Mono** (400 weight, 13px, Geist Mono): All times in the schedule (`8:30 AM`, `10:00 AM`), date strings, sort order. Always mono, always.

**The Mono Gate Rule.** Times, dates, and numbers use Geist Mono. Everything else uses Geist. This rule has no exceptions.

## 4. Elevation

Flat by default. This system uses tonal surface layers, not shadows. The four surface steps (bg / surface / surface-2 / border) create all the depth the interface needs.

Shadows are prohibited except for one case: floating overlays (dropdowns, tooltips) may use a single diffuse shadow — `0 8px 24px oklch(0% 0 0 / 0.4)` — to lift them above the tonal stack. Nothing else.

**The Flat-by-Default Rule.** If an element needs a shadow to feel elevated, check first whether placing it on `--surface` instead of `--bg` resolves it. Usually it does. Reach for shadows only when tonal context is genuinely unavailable.

## 5. Components

### Day Type Picker (signature component)
The core interaction of the app. Three pill buttons — Full, Half, Light — in a row. Unselected: text in `--text-3`, no background. Selected: colored text on tinted background using the day-type palette. Active press: `scale(0.97)`, 120ms `--ease-out`. No border on any state — the background tint and color are enough.

### Week Strip Pills
Seven compact pills showing Mon–Sun. Unselected: day abbreviation in `--text-2`, no background. Today: Steady Emerald text + emerald-tinted background. Selected (not today): `--surface-2` background, `--text-1` text. Completion indicated by a small dot beneath the day name, colored by day type. Transition on selection: 150ms `--ease-out` on background and color only.

### Task Checkbox
18×18px square, `6px` radius. Unchecked: `--surface-2` background, `--border` border. Checked: `--accent-bg` background, Steady Emerald checkmark icon. Transition: 120ms `--ease-out` on background and border. Completed task label: `--text-3` color, `line-through` decoration. No animation on the label — the checkbox is enough.

### Schedule Blocks
Not cards. A vertical list separated by spacing alone — no card borders, no backgrounds. Time (Geist Mono, `--text-2`) left-aligned in a fixed-width column (~64px). Label (`--text-1`) and note (`--text-3`) beside it. A thin `1px` left rule in `--border` runs the full block height — this is structural, not decorative. Thin enough that it reads as a timeline, not a stripe.

### Wake Time Input
A plain `<input type="time">` with custom styling: `--surface-2` background, `--border` border, `6px` radius, Geist Mono for the time value. Focus: border shifts to `--accent`. No glow, no shadow — border color change is sufficient.

### PR Banner
A single line of text at the top of the day panel on Full/Half days. `--surface` background, `--text-2` text, `--border` full border, `10px` radius. No icon. Not dismissable — it's a daily prompt, not a notification.

## 6. Do's and Don'ts

### Do:
- **Do** use `--surface` as the background for all day cards and panels — never `--bg` directly on content areas.
- **Do** use Geist Mono for every time string in the schedule. `8:30 AM` in sans-serif is a copy error.
- **Do** apply `scale(0.97)` on `:active` for all clickable elements — 120ms, `--ease-out`. This is the only feedback most buttons need.
- **Do** use the day-type color (full/half/light tokens) exclusively for indicators — pills, dots, badges. Never as a large surface fill.
- **Do** keep Steady Emerald to today, active state, and completion. Three uses. No more.
- **Do** express depth through surface steps, not shadows. `--bg` → `--surface` → `--surface-2` is the elevation vocabulary.
- **Do** use `transition: property Xms --ease-out` on every interactive element. The custom curve is non-negotiable.

### Don't:
- **Don't** use a light theme. This tool has one mode. If the system preference changes, DayStack does not follow it.
- **Don't** add gamification: no streak counters as big numbers, no completion rings, no confetti, no celebration animations on task completion.
- **Don't** make this look like a generic SaaS dashboard — no white cards on white background, no blue primary buttons, no KPI metrics at the top, no Inter font.
- **Don't** make this look like Notion — no document-like block editing feel, no cluttered sidebars, no everything-is-editable affordance.
- **Don't** use `border-left` or `border-right` greater than 1px as a colored accent stripe. The schedule timeline rule is 1px `--border`, not a color stripe. Rewrite as a background tint or spacing if the urge arises.
- **Don't** use gradient text (`background-clip: text`). Use a solid color from the palette.
- **Don't** add illustrations, decorative icons, or empty-state artwork. An unset day is expressed with muted text and a type picker — not an illustration of a calendar.
- **Don't** animate layout properties (`height`, `width`, `padding`, `margin`). Animate `transform` and `opacity` only.
- **Don't** put the same padding on everything. Vary spacing for rhythm — the schedule, the task list, the day header all breathe differently.
