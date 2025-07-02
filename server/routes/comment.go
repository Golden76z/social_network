package routes

import (
	"github.com/Golden76z/social-network/api"
)

func setupCommentRoutes(r *Router) {
	r.POST("/api/comment", api.CreateCommentHandler)
	r.GET("/api/comment", api.GetCommentHandler)
	r.PUT("/api/comment", api.UpdateCommentHandler)
	r.DELETE("/api/comment", api.DeleteCommentHandler)
}
