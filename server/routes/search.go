package routes

import (
	"github.com/Golden76z/social-network/api"
)

func setupSearchRoutes(r *Router) {
	// Search routes
	r.GET("/api/search/users", api.SearchUsersHandler)
	r.GET("/api/search/groups", api.SearchGroupsHandler)
	r.GET("/api/search/posts", api.SearchPostsHandler)
}
