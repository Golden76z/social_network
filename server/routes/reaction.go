package routes

import (
	"github.com/Golden76z/social-network/api"
)

func setupReactionRoutes(r *Router) {
	r.POST("/api/reaction", api.CreateUserReactionHandler)
	r.GET("/api/reaction", api.GetUserReactionHandler)
	r.PUT("/api/reaction", api.UpdateUserReactionHandler)
	r.DELETE("/api/reaction", api.DeleteUserReactionHandler)
}
