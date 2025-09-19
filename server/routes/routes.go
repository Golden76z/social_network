package routes

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/Golden76z/social-network/api"
	"github.com/Golden76z/social-network/config"
	"github.com/Golden76z/social-network/middleware"
	"github.com/Golden76z/social-network/websockets"
)

func SetupRoutes(r *Router, db *sql.DB, wsHub *websockets.Hub, cfg *config.Config) {
	// Add debug route directly to test
	r.GET("/debug", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Debug route working"))
	})

	setupPublicRoutes(r, wsHub, cfg)
	setupProtectedRoutes(r)
}

func setupPublicRoutes(r *Router, wsHub *websockets.Hub, cfg *config.Config) {
	// Public routes group
	r.Group(func(r *Router) {
		setupAuthRoutes(r)
		setupWebSocketRoutes(r, wsHub, cfg)

		// Public posts route (no authentication required)
		r.GET("/api/posts/public", api.GetPublicPostsHandler)

		// Test routes for debugging
		r.GET("/api/test/cookie", api.TestCookieHandler)
		r.GET("/api/test/auth", api.TestAuthHandler)
		r.GET("/api/test/debug-cookies", api.DebugCookieHandler)

		// Debug route to test if routes are working
		r.GET("/debug", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("Debug route working"))
		})
	})
}

func setupProtectedRoutes(r *Router) {
	// Protected routes group
	r.Group(func(r *Router) {
		// Apply auth middleware first
		r.Use(middleware.AuthMiddleware())
		r.Use(middleware.RateLimit(1000, time.Minute))
		// Temporarily disable CSRF for testing
		// r.Use(middleware.CSRFMiddleware)

		setupUserRoutes(r)
		setupPostRoutes(r)
		setupCommentRoutes(r)
		setupReactionRoutes(r)
		setupGroupRoutes(r)
		setupFollowRoutes(r)
		setupChatRoutes(r)
		setupNotificationsRoutes(r)

		// Test protected route
		r.GET("/api/test/conversations", api.TestConversationsHandler)
	})
}
