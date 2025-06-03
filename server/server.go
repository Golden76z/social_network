package main

import (
	"formbuilder-api/api"
	"formbuilder-api/middleware"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	chi_mw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/go-chi/httprate"
)

const defaultPort = "8080"

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}

	r := chi.NewRouter()

	// Basic Middlewares checks
	r.Use(chi_mw.Logger)
	r.Use(chi_mw.Recoverer)
	// Only allow requests from proxy IP (Only use with a proxy)
	// r.Use(middleware.RealIPWithTrustedProxies([]string{"127.0.0.1", "10.0.0.0/8"}))

	// Security Middlewares (applied to all routes)
	r.Use(middleware.SecurityHeaders)

	// Production-appropriate CORS
	if os.Getenv("ENV") == "production" {
		r.Use(cors.Handler(cors.Options{
			AllowedOrigins:   []string{"https://localhost:3030"},
			AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
			AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
			ExposedHeaders:   []string{"Link"},
			AllowCredentials: true,
			MaxAge:           300,
		}))
	} else {
		// Dev environment - more permissive
		r.Use(cors.Handler(cors.Options{
			AllowedOrigins: []string{"*"},
			AllowedMethods: []string{"GET", "POST", "OPTIONS"},
			AllowedHeaders: []string{"*"},
		}))
	}

	// Public Routes
	r.Group(func(r chi.Router) {
		// Playground only in development
		if os.Getenv("ENV") != "production" {
			// Dev env routes
		}

		// Auth routes with stricter rate limiting
		r.Group(func(r chi.Router) {
			r.Use(httprate.Limit(5, time.Minute))
			r.Post("/auth/login", api.LoginHandler)
			r.Post("/auth/register", api.RegisterHandler)
		})
	})

	// Protected Routes
	r.Group(func(r chi.Router) {
		r.Use(middleware.AuthMiddleware)
		r.Use(middleware.CSRFMiddleware)
		r.Use(httprate.Limit(10, time.Minute, httprate.WithKeyFuncs(middleware.UserKeyFunc)))

		// Insert your protected routes here
		// r.Handle("/example", example)
	})

	// HTTPS Redirection (in production)
	if os.Getenv("ENV") == "production" {
		go func() {
			log.Fatal(http.ListenAndServe(":80", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				http.Redirect(w, r, "https://"+r.Host+r.URL.String(), http.StatusMovedPermanently)
			})))
		}()
	}

	// Initialisation of the database tables
	// db.InitDB()

	// Server Startup
	log.Printf("Server running on port %s", port)
	server := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  120 * time.Second,
	}
	log.Fatal(server.ListenAndServe())
}
