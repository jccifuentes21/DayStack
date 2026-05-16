package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"daystack/models"

	"github.com/go-chi/chi/v5"
)

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

type updateDayRequest struct {
	DayType  *string `json:"day_type"`
	WakeTime *string `json:"wake_time"`
	Notes    *string `json:"notes"`
	Focus    *string `json:"focus"`
}

// UpdateDay handles PATCH /api/days/{id}.
// Accepts partial updates — only the fields present in the body are changed.
// If day_type changes, tasks are deleted and regenerated from the template.
func UpdateDay(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := strconv.Atoi(chi.URLParam(r, "id"))
		if err != nil {
			jsonError(w, 400, "invalid day id")
			return
		}

		var req updateDayRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			jsonError(w, 400, "invalid request body")
			return
		}

		// Fetch the current day_type so we know whether it changed.
		var oldType string
		err = db.QueryRow(`SELECT day_type FROM days WHERE id = $1`, id).Scan(&oldType)
		if err == sql.ErrNoRows {
			jsonError(w, 404, "day not found")
			return
		}
		if err != nil {
			jsonError(w, 500, err.Error())
			return
		}

		// Build a partial UPDATE — only touch the columns that were sent.
		setClauses := []string{}
		args := []any{}
		n := 1
		if req.DayType != nil {
			setClauses = append(setClauses, fmt.Sprintf("day_type = $%d", n))
			args = append(args, *req.DayType)
			n++
		}
		if req.WakeTime != nil {
			setClauses = append(setClauses, fmt.Sprintf("wake_time = $%d", n))
			args = append(args, *req.WakeTime)
			n++
		}
		if req.Notes != nil {
			setClauses = append(setClauses, fmt.Sprintf("notes = $%d", n))
			args = append(args, *req.Notes)
			n++
		}
		if req.Focus != nil {
			setClauses = append(setClauses, fmt.Sprintf("focus = $%d", n))
			args = append(args, *req.Focus)
			n++
		}
		if len(setClauses) > 0 {
			args = append(args, id)
			query := fmt.Sprintf("UPDATE days SET %s WHERE id = $%d",
				strings.Join(setClauses, ", "), n)
			if _, err := db.Exec(query, args...); err != nil {
				jsonError(w, 500, err.Error())
				return
			}
		}

		// Regenerate tasks when day_type changed.
		newType := oldType
		if req.DayType != nil {
			newType = *req.DayType
		}
		if req.DayType != nil && newType != oldType {
			if err := regenerateTasks(db, id, newType); err != nil {
				jsonError(w, 500, err.Error())
				return
			}
		}

		day, err := loadDay(db, id)
		if err != nil {
			jsonError(w, 500, err.Error())
			return
		}
		jsonOK(w, day)
	}
}

// ResetDay handles POST /api/days/{id}/reset.
// Clears day_type back to unset, wipes focus, and deletes all tasks.
func ResetDay(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := strconv.Atoi(chi.URLParam(r, "id"))
		if err != nil {
			jsonError(w, 400, "invalid day id")
			return
		}

		tx, err := db.Begin()
		if err != nil {
			jsonError(w, 500, err.Error())
			return
		}
		defer tx.Rollback()

		if _, err := tx.Exec(
			`UPDATE days SET day_type = 'unset', wake_time = '', focus = '', notes = '' WHERE id = $1`, id,
		); err != nil {
			jsonError(w, 500, err.Error())
			return
		}
		if _, err := tx.Exec(`DELETE FROM tasks WHERE day_id = $1`, id); err != nil {
			jsonError(w, 500, err.Error())
			return
		}
		if err := tx.Commit(); err != nil {
			jsonError(w, 500, err.Error())
			return
		}

		day, err := loadDay(db, id)
		if err != nil {
			jsonError(w, 500, err.Error())
			return
		}
		jsonOK(w, day)
	}
}

// regenerateTasks deletes all tasks for a day and inserts fresh ones from the template.
// Called whenever day_type changes.
func regenerateTasks(db *sql.DB, dayID int, dayType string) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`DELETE FROM tasks WHERE day_id = $1 AND source = 'template'`, dayID); err != nil {
		return err
	}

	for i, label := range taskTemplates[dayType] {
		_, err := tx.Exec(
			`INSERT INTO tasks (day_id, label, sort_order, source) VALUES ($1, $2, $3, 'template')`,
			dayID, label, i,
		)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

// loadDay returns a single Day with its tasks.
func loadDay(db *sql.DB, dayID int) (*models.Day, error) {
	rows, err := db.Query(`
		SELECT d.id, d.date, d.day_type, COALESCE(d.wake_time,''), COALESCE(d.notes,''), COALESCE(d.focus,''),
		       t.id, t.label, t.completed, t.sort_order, COALESCE(t.source,'template')
		FROM days d
		LEFT JOIN tasks t ON t.day_id = d.id
		WHERE d.id = $1
		ORDER BY t.source DESC, t.sort_order
	`, dayID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var day *models.Day
	for rows.Next() {
		var (
			id       int
			date     string
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
		if err := rows.Scan(&id, &date, &dayType, &wakeTime, &notes, &focus,
			&taskID, &label, &done, &order, &source); err != nil {
			return nil, err
		}
		if day == nil {
			day = &models.Day{
				ID:       id,
				Date:     date,
				DayType:  dayType,
				WakeTime: wakeTime,
				Notes:    notes,
				Focus:    focus,
				Tasks:    []models.Task{},
			}
		}
		if taskID.Valid {
			day.Tasks = append(day.Tasks, models.Task{
				ID:        int(taskID.Int64),
				Label:     label.String,
				Completed: done.Bool,
				SortOrder: int(order.Int64),
				Source:    source.String,
			})
		}
	}
	return day, rows.Err()
}
