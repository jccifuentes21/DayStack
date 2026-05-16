package main

import (
	"log"
	"net/http"
	"os"

	"daystack/db"
	"daystack/handlers"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env when running locally. On Railway the env vars are injected directly,
	// so godotenv gracefully does nothing if the file is absent.
	_ = godotenv.Load()

	database, err := db.Connect()
	if err != nil {
		log.Fatalf("db connect: %v", err)
	}
	defer database.Close()

	if err := db.RunMigrations(database); err != nil {
		log.Fatalf("migrations: %v", err)
	}
	log.Println("migrations ok")

	r := chi.NewRouter()
	r.Use(middleware.Logger)    // prints method + path + status + duration to stdout
	r.Use(middleware.Recoverer) // catches panics and returns 500 instead of crashing
	r.Use(corsMiddleware)

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("ok"))
	})

	r.Route("/api", func(r chi.Router) {
		r.Get("/weeks/current", handlers.GetCurrentWeek(database))
		r.Get("/weeks/{week_start}", handlers.GetWeekByStart(database))
		r.Patch("/days/{id}", handlers.UpdateDay(database))
		r.Patch("/tasks/{id}", handlers.UpdateTask(database))
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("listening on :%s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatal(err)
	}
}

// corsMiddleware allows the frontend (different origin on Vercel) to talk to the API.
// Set ALLOWED_ORIGIN=https://your-app.vercel.app in prod; leave unset to allow all in dev.
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := os.Getenv("ALLOWED_ORIGIN")
		if origin == "" {
			origin = "*"
		}
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}
