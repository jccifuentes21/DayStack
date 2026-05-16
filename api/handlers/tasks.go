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

// UpdateTask handles PATCH /api/tasks/{id}.
// Toggles (or sets) the completed field on a single task.
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
			RETURNING id, label, completed, sort_order
		`, req.Completed, id).Scan(&task.ID, &task.Label, &task.Completed, &task.SortOrder)

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
