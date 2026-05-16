package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"daystack/models"
)

// GetWeek handles GET /api/weeks?offset=0.
// offset is the number of weeks relative to the current week (0 = this week, -1 = last week, etc.).
// Defaults to 0 if omitted.
func GetWeek(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		offset, _ := strconv.Atoi(r.URL.Query().Get("offset")) // defaults to 0 on parse failure

		var weekStart time.Time
		err := db.QueryRow(
			`SELECT (DATE_TRUNC('week', CURRENT_DATE) + ($1 * 7 * INTERVAL '1 day'))::date`,
			offset,
		).Scan(&weekStart)
		if err != nil {
			jsonError(w, 500, "failed to compute week")
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
func getOrCreateWeek(db *sql.DB, weekStart time.Time) (*models.Week, error) {
	tx, err := db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

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
func loadWeek(db *sql.DB, weekID int, weekStart time.Time) (*models.Week, error) {
	rows, err := db.Query(`
		SELECT d.id, d.date, d.day_type, COALESCE(d.wake_time,''), COALESCE(d.notes,''), COALESCE(d.focus,''),
		       t.id, t.label, t.completed, t.sort_order, COALESCE(t.source,'template')
		FROM days d
		LEFT JOIN tasks t ON t.day_id = d.id
		WHERE d.week_id = $1
		ORDER BY d.date, t.source DESC, t.sort_order
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
			focus    string
			taskID   sql.NullInt64
			label    sql.NullString
			done     sql.NullBool
			order    sql.NullInt64
			source   sql.NullString
		)
		if err := rows.Scan(&dayID, &dayDate, &dayType, &wakeTime, &notes, &focus,
			&taskID, &label, &done, &order, &source); err != nil {
			return nil, err
		}

		if currentDay == nil || currentDay.ID != dayID {
			week.Days = append(week.Days, models.Day{
				ID:       dayID,
				Date:     dayDate.Format("2006-01-02"),
				DayType:  dayType,
				WakeTime: wakeTime,
				Notes:    notes,
				Focus:    focus,
				Tasks:    []models.Task{},
			})
			currentDay = &week.Days[len(week.Days)-1]
		}

		if taskID.Valid {
			currentDay.Tasks = append(currentDay.Tasks, models.Task{
				ID:        int(taskID.Int64),
				Label:     label.String,
				Completed: done.Bool,
				SortOrder: int(order.Int64),
				Source:    source.String,
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
