package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"daystack/models"

	"github.com/go-chi/chi/v5"
)

// GetCurrentWeek handles GET /api/weeks/current.
// Asks Postgres for the Monday of the current week, then delegates to getOrCreateWeek.
func GetCurrentWeek(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var weekStart time.Time
		err := db.QueryRow(`SELECT DATE_TRUNC('week', CURRENT_DATE)::date`).Scan(&weekStart)
		if err != nil {
			jsonError(w, 500, "failed to compute current week")
			return
		}
		week, err := getOrCreateWeek(db, weekStart)
		if err != nil {
			jsonError(w, 500, err.Error())
			return
		}
		jsonOK(w, week)
	}
}

// GetWeekByStart handles GET /api/weeks/{week_start}.
// The client passes the Monday date (e.g. "2026-05-11") when navigating prev/next weeks.
func GetWeekByStart(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		param := chi.URLParam(r, "week_start")
		weekStart, err := time.Parse("2006-01-02", param)
		if err != nil {
			jsonError(w, 400, "week_start must be YYYY-MM-DD")
			return
		}
		week, err := getOrCreateWeek(db, weekStart)
		if err != nil {
			jsonError(w, 500, err.Error())
			return
		}
		jsonOK(w, week)
	}
}

// getOrCreateWeek ensures a week row and its 7 day rows exist, then returns
// the week fully hydrated with days and tasks.
//
// The ON CONFLICT DO NOTHING approach means multiple concurrent calls are safe —
// only one insert wins, but everyone reads the same row afterwards.
func getOrCreateWeek(db *sql.DB, weekStart time.Time) (*models.Week, error) {
	tx, err := db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// Upsert the week row.
	_, err = tx.Exec(
		`INSERT INTO weeks (week_start) VALUES ($1) ON CONFLICT (week_start) DO NOTHING`,
		weekStart,
	)
	if err != nil {
		return nil, err
	}

	var weekID int
	err = tx.QueryRow(`SELECT id FROM weeks WHERE week_start = $1`, weekStart).Scan(&weekID)
	if err != nil {
		return nil, err
	}

	// Upsert all 7 day rows (Mon=+0 … Sun=+6).
	for i := 0; i < 7; i++ {
		date := weekStart.AddDate(0, 0, i)
		_, err = tx.Exec(
			`INSERT INTO days (week_id, date) VALUES ($1, $2) ON CONFLICT (date) DO NOTHING`,
			weekID, date,
		)
		if err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return loadWeek(db, weekID, weekStart)
}

// loadWeek reads a fully-hydrated week from the DB with a single JOIN query.
// Rows come back as (day, task?) pairs — we group them in Go.
func loadWeek(db *sql.DB, weekID int, weekStart time.Time) (*models.Week, error) {
	rows, err := db.Query(`
		SELECT d.id, d.date, d.day_type, COALESCE(d.wake_time,''), COALESCE(d.notes,''),
		       t.id, t.label, t.completed, t.sort_order
		FROM days d
		LEFT JOIN tasks t ON t.day_id = d.id
		WHERE d.week_id = $1
		ORDER BY d.date, t.sort_order
	`, weekID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	week := &models.Week{
		ID:        weekID,
		WeekStart: weekStart.Format("2006-01-02"),
		Days:      []models.Day{},
	}

	var currentDay *models.Day
	for rows.Next() {
		var (
			dayID    int
			dayDate  time.Time
			dayType  string
			wakeTime string
			notes    string
			taskID   sql.NullInt64
			label    sql.NullString
			done     sql.NullBool
			order    sql.NullInt64
		)
		if err := rows.Scan(&dayID, &dayDate, &dayType, &wakeTime, &notes,
			&taskID, &label, &done, &order); err != nil {
			return nil, err
		}

		// Start a new Day when the day ID changes.
		if currentDay == nil || currentDay.ID != dayID {
			week.Days = append(week.Days, models.Day{
				ID:       dayID,
				Date:     dayDate.Format("2006-01-02"),
				DayType:  dayType,
				WakeTime: wakeTime,
				Notes:    notes,
				Tasks:    []models.Task{},
			})
			currentDay = &week.Days[len(week.Days)-1]
		}

		// Append the task if this row has one (LEFT JOIN may produce NULL task cols).
		if taskID.Valid {
			currentDay.Tasks = append(currentDay.Tasks, models.Task{
				ID:        int(taskID.Int64),
				Label:     label.String,
				Completed: done.Bool,
				SortOrder: int(order.Int64),
			})
		}
	}

	return week, rows.Err()
}

// jsonOK writes a 200 JSON response.
func jsonOK(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}

// jsonError writes an error JSON response.
func jsonError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
