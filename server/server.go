package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Golden76z/social-network/db"
	"github.com/Golden76z/social-network/db/migrations"
	"github.com/Golden76z/social-network/middleware"
	"github.com/Golden76z/social-network/router"
	"github.com/Golden76z/social-network/websockets"

	_ "github.com/mattn/go-sqlite3"
)

const defaultPort = "8080"

func main() {
	// Loading the env variable for the port (default value if nothing found)
	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}

	// Define DB path and migrations directory
	dbPath := "social_network.db"
	migrationsDir := "db/migrations"

	// Run migrations (creates tables if not exist)
	if err := migrations.RunMigrations(dbPath, migrationsDir); err != nil {
		log.Fatal("Failed to run migrations:", err)
	}

	// Initialize database connection for CRUD operations
	DB, err := db.InitDB()
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer DB.Close()

	// Create custom router
	r := router.New()

	// Initiate websockets HUB
	wsHub := websockets.NewHub(DB)
	go wsHub.Run()

	// Basic middleware for all routes
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.SecurityHeaders)

	// CORS middleware
	if os.Getenv("ENV") == "PRODUCTION" {
		r.Use(middleware.CORS(middleware.CORSConfig{
			AllowedOrigins:   []string{"https://localhost:3030"},
			AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
			AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
			ExposedHeaders:   []string{"Link"},
			AllowCredentials: true,
			MaxAge:           300,
		}))
	} else {
		// Dev environment - more permissive
		r.Use(middleware.CORS(middleware.CORSConfig{
			AllowedOrigins: []string{"*"},
			AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
			AllowedHeaders: []string{"*"},
		}))
	}

	// Public Routes Group
	r.Group(func(r *router.Router) {
		// Auth routes with rate limiting
		r.Group(func(r *router.Router) {
			r.Use(middleware.RateLimit(5, time.Minute))

			// Authentication routes (TO IMPLEMENT)
			// r.POST("/auth/login", api.LoginHandler(DB))
			// r.POST("/auth/register", api.RegisterHandler(DB))
			// r.POST("/auth/logout", api.LogoutHandler())
		})

		// WebSocket endpoint (TO IMPLEMENT)
		r.GET("/ws", websockets.Handler(wsHub))

		// Health check (TO IMPLEMENT)
		// r.GET("/health", api.HealthHandler())
	})

	// Protected Routes Group
	r.Group(func(r *router.Router) {
		r.Use(middleware.AuthMiddleware(DB))
		r.Use(middleware.CSRFMiddleware)
		r.Use(middleware.RateLimit(100, time.Minute))

		// User routes (TO IMPLEMENT)
		// r.GET("/api/user/profile", api.GetUserProfileHandler(DB))
		// r.PUT("/api/user/profile", api.UpdateUserProfileHandler(DB))
	})

	// HTTPS redirect in production
	if os.Getenv("ENV") == "PRODUCTION" {
		go func() {
			log.Println("Starting HTTP to HTTPS redirect server on :80")
			redirectServer := &http.Server{
				Addr: ":80",
				Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					http.Redirect(w, r, "https://"+r.Host+r.URL.String(), http.StatusMovedPermanently)
				}),
				ReadTimeout:  10 * time.Second,
				WriteTimeout: 10 * time.Second,
			}
			log.Fatal(redirectServer.ListenAndServe())
		}()
	}

	// Create server with timeouts
	server := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// Graceful shutdown
	go func() {
		log.Printf("Server running on port %s", port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("Server failed to start:", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// Give outstanding requests 30 seconds to complete
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exited")
}
