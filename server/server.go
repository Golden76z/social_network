package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Golden76z/social-network/config"
	"github.com/Golden76z/social-network/db"
	"github.com/Golden76z/social-network/db/migrations"
	"github.com/Golden76z/social-network/middleware"
	"github.com/Golden76z/social-network/routes"
	"github.com/Golden76z/social-network/utils"
	"github.com/Golden76z/social-network/websockets"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	// Load configuration
	err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}
	cfg := config.GetConfig()

	// Run DB migrations
	if err := migrations.RunMigrations(cfg.DBPath, cfg.MigrationsDir); err != nil {
		log.Fatal("Failed to run migrations:", err)
	}

	// Initialize DB
	dbService, err := db.InitDB()
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer dbService.DB.Close()

	// Start session cleanup - Goroutine that clean expired sessions in db every hour
	go utils.StartSessionCleanup(dbService.DB, 1*time.Hour)

	// Initialize WebSocket hub
	websockets.InitHub(dbService.DB)
	wsHub := websockets.GetHub()

	// Setup router and middleware
	r := routes.New()
	// r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.SecurityHeaders)
	r.Use(middleware.SetupCORS())

	// Setup routes
	routes.SetupRoutes(r, dbService.DB, wsHub, cfg)

	// Start server
	startServer(r, cfg)
}

func startServer(handler http.Handler, cfg *config.Config) {
	// Redirect HTTP to HTTPS in production
	if cfg.Environment == "PRODUCTION" {
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

	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      handler,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// Start server
	go func() {
		log.Printf("Server running on port %s", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("Server failed to start:", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exited")
}
