package routes

import (
	"database/sql"
	"time"

	"github.com/Golden76z/social-network/api"
	"github.com/Golden76z/social-network/config"
	"github.com/Golden76z/social-network/middleware"
	"github.com/Golden76z/social-network/websockets"
)

func SetupRoutes(r *Router, db *sql.DB, wsHub *websockets.Hub, cfg *config.Config) {
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
	})
}

func setupProtectedRoutes(r *Router) {
	// Protected routes group
	r.Group(func(r *Router) {
		// Apply auth middleware
		r.Use(middleware.AuthMiddleware())
		r.Use(middleware.CSRFMiddleware)
		r.Use(middleware.RateLimit(1000, time.Minute))

		setupUserRoutes(r)
		setupPostRoutes(r)
		setupCommentRoutes(r)
		setupReactionRoutes(r)
		setupGroupRoutes(r)
		setupFollowRoutes(r)
		setupChatRoutes(r)
		setupNotificationsRoutes(r)
	})
}
