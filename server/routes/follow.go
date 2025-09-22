package routes

import (
	"github.com/Golden76z/social-network/api"
)

func setupFollowRoutes(r *Router) {
	// Following/Followers
	r.POST("/api/user/follow", api.CreateFollowHandler)
	r.GET("/api/user/follower", api.GetFollowerHandler)
	r.GET("/api/user/following", api.GetFollowingHandler)
	r.GET("/api/user/mutual-friends", api.GetMutualFriendsHandler)
	r.PUT("/api/user/follow", api.UpdateFollowHandler)
	r.DELETE("/api/user/follow", api.DeleteFollowHandler)

	// Follow request management
	r.POST("/api/user/follow/accept", api.AcceptFollowRequestHandler)
	r.POST("/api/user/follow/decline", api.DeclineFollowRequestHandler)
	r.POST("/api/user/follow/cancel", api.CancelFollowRequestHandler)

	// Test route for debugging follow functionality
	r.GET("/api/test/follow", api.TestFollowAPIHandler)
}
