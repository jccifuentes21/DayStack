package db

import (
	"database/sql"
	"embed"
	"fmt"
	"os"
	"sort"

	_ "github.com/lib/pq"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

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

// RunMigrations reads every *.sql file in migrations/ in alphabetical order
// and executes each one. Safe to call on every boot — all statements are idempotent.
func RunMigrations(db *sql.DB) error {
	entries, err := migrationsFS.ReadDir("migrations")
	if err != nil {
		return fmt.Errorf("reading migrations dir: %w", err)
	}

	// Sort the entries by name in alphabetical order
	sort.Slice(entries, func(i, j int) bool {
		return entries[i].Name() < entries[j].Name()
	})

	for _, entry := range entries {
		sql, err := migrationsFS.ReadFile("migrations/" + entry.Name())
		if err != nil {
			return fmt.Errorf("reading %s: %w", entry.Name(), err)
		}
		if _, err := db.Exec(string(sql)); err != nil {
			return fmt.Errorf("running %s: %w", entry.Name(), err)
		}
	}

	return nil
}
