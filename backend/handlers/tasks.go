package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"daystack/models"

	"github.com/go-chi/chi/v5"
)

type updateTaskRequest struct {
	Completed bool `json:"completed"`
}

type createTaskRequest struct {
	Label string `json:"label"`
}

// UpdateTask handles PATCH /api/tasks/{id}.
func UpdateTask(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := strconv.Atoi(chi.URLParam(r, "id"))
		if err != nil {
			jsonError(w, 400, "invalid task id")
			return
		}

		var req updateTaskRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			jsonError(w, 400, "invalid request body")
			return
		}

		var task models.Task
		err = db.QueryRow(`
			UPDATE tasks SET completed = $1 WHERE id = $2
			RETURNING id, label, completed, sort_order, COALESCE(source, 'template')
		`, req.Completed, id).Scan(&task.ID, &task.Label, &task.Completed, &task.SortOrder, &task.Source)

		if err == sql.ErrNoRows {
			jsonError(w, 404, "task not found")
			return
		}
		if err != nil {
			jsonError(w, 500, err.Error())
			return
		}

		jsonOK(w, task)
	}
}

// CreateTask handles POST /api/days/{id}/tasks.
// Inserts a custom task for the given day.
func CreateTask(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		dayID, err := strconv.Atoi(chi.URLParam(r, "id"))
		if err != nil {
			jsonError(w, 400, "invalid day id")
			return
		}

		var req createTaskRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Label == "" {
			jsonError(w, 400, "label is required")
			return
		}

		// Sort custom tasks after template tasks — find current max sort_order and add 1.
		var maxOrder int
		db.QueryRow(`SELECT COALESCE(MAX(sort_order), -1) FROM tasks WHERE day_id = $1`, dayID).Scan(&maxOrder)

		var task models.Task
		err = db.QueryRow(`
			INSERT INTO tasks (day_id, label, sort_order, source)
			VALUES ($1, $2, $3, 'custom')
			RETURNING id, label, completed, sort_order, source
		`, dayID, req.Label, maxOrder+1).Scan(&task.ID, &task.Label, &task.Completed, &task.SortOrder, &task.Source)

		if err != nil {
			jsonError(w, 500, err.Error())
			return
		}

		jsonOK(w, task)
	}
}

// DeleteTask handles DELETE /api/tasks/{id}.
// Only custom tasks can be deleted.
func DeleteTask(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := strconv.Atoi(chi.URLParam(r, "id"))
		if err != nil {
			jsonError(w, 400, "invalid task id")
			return
		}

		result, err := db.Exec(`DELETE FROM tasks WHERE id = $1 AND source = 'custom'`, id)
		if err != nil {
			jsonError(w, 500, err.Error())
			return
		}

		rows, _ := result.RowsAffected()
		if rows == 0 {
			jsonError(w, 404, "task not found or not deletable")
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}
