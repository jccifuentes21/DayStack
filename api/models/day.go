package models

type Day struct {
	ID       int    `json:"id"`
	Date     string `json:"date"`      // "2026-05-11"
	DayType  string `json:"day_type"`  // "full" | "half" | "light" | "unset"
	WakeTime string `json:"wake_time"` // "08:30" or ""
	Notes    string `json:"notes"`
	Tasks    []Task `json:"tasks"`
}
