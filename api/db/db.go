package db

import (
	"database/sql"
	_ "embed"
	"fmt"
	"os"

	_ "github.com/lib/pq"
)

//go:embed migrations/001_init.sql
var initSQL string

// Connect opens a connection pool using DATABASE_URL from the environment.
func Connect() (*sql.DB, error) {
	url := os.Getenv("DATABASE_URL")
	if url == "" {
		return nil, fmt.Errorf("DATABASE_URL not set")
	}
	db, err := sql.Open("postgres", url)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("cannot reach database: %w", err)
	}
	return db, nil
}

// RunMigrations executes the embedded SQL migration. Safe to call on every boot
// because every statement uses IF NOT EXISTS.
func RunMigrations(db *sql.DB) error {
	_, err := db.Exec(initSQL)
	return err
}
