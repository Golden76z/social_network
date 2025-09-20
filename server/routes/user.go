package routes

import (
	"github.com/Golden76z/social-network/api"
)

func setupUserRoutes(r *Router) {
	// Profile routes
	r.GET("/api/user/profile", api.GetUserProfileHandler)
	r.PUT("/api/user/profile", api.UpdateUserProfileHandler)

	// Notification routes
	r.POST("/api/user/notifications", api.SendUserNotificationsHandler)
	r.GET("/api/user/notifications", api.GetUserNotificationsHandler)
	r.PUT("/api/user/notifications", api.UpdateUserNotificationsHandler)
	r.DELETE("/api/user/notifications", api.DeleteUserNotificationsHandler)

	// Upload routes
	r.POST("/api/upload/avatar", api.UploadAvatarHandler)
}
