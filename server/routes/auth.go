package routes

import (
	"time"

	"github.com/Golden76z/social-network/api"
	"github.com/Golden76z/social-network/middleware"
)

func setupAuthRoutes(r *Router) {
	r.Group(func(r *Router) {
		r.Use(middleware.RateLimit(5, time.Minute))

		r.GET("/", api.HomeHandler)
		r.POST("/auth/login", api.LoginHandler)
		r.POST("/auth/register", api.RegisterHandler)
		r.POST("/auth/logout", api.LogoutHandler)
	})
}
