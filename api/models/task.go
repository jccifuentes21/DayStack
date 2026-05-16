package models

type Task struct {
	ID        int    `json:"id"`
	Label     string `json:"label"`
	Completed bool   `json:"completed"`
	SortOrder int    `json:"sort_order"`
}
