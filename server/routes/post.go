package routes

import (
	"github.com/Golden76z/social-network/api"
)

func setupPostRoutes(r *Router) {
	r.POST("/api/post", api.CreatePostHandler)
	r.GET("/api/post", api.GetPostHandler)
	r.PUT("/api/post", api.UpdatePostHandler)
	r.DELETE("/api/post", api.DeletePostHandler)
}
