package routes

import (
	"github.com/Golden76z/social-network/api"
)

func setupNotificationsRoutes(r *Router) {
	r.POST("/api/user/notifications", api.SendUserNotificationsHandler)
	r.GET("/api/user/notifications", api.GetUserNotificationsHandler)
	r.PUT("/api/user/notifications", api.UpdateUserNotificationsHandler)
	r.DELETE("/api/user/notifications", api.DeleteUserNotificationsHandler)
}
