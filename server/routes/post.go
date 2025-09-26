package routes

import (
	"github.com/Golden76z/social-network/api"
)

func setupPostRoutes(r *Router) {
	r.POST("/api/post", api.CreatePostHandler)
	r.GET("/api/post", api.GetPostHandler)
	r.PUT("/api/post/{id}", api.UpdatePostHandler)
	r.DELETE("/api/post/{id}", api.DeletePostHandler)

	// Post visibility management
	r.GET("/api/post/{id}/visibility", api.GetPostVisibilityHandler)
	r.PUT("/api/post/{id}/visibility", api.UpdatePostVisibilityHandler)

	// Upload post image
	r.POST("/api/upload/post-image", api.UploadPostImageHandler)
}
