package models

type Week struct {
	ID        int    `json:"id"`
	WeekStart string `json:"week_start"` // "2026-05-11" — always a Monday
	Days      []Day  `json:"days"`
}
