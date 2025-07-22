package routes

import (
	"github.com/Golden76z/social-network/api"
)

func setupFollowRoutes(r *Router) {
	// Following/Followers
	r.POST("/api/user/follow", api.CreateFollowHandler)
	r.GET("/api/user/follower", api.GetFollowerHandler)
	r.GET("/api/user/following", api.GetFollowingHandler)
	r.PUT("/api/user/follow", api.UpdateFollowHandler)
	r.DELETE("/api/user/follow", api.DeleteFollowHandler)
}
