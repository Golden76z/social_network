package routes

import "github.com/Golden76z/social-network/api"

func setupChatRoutes(r *Router) {
	// Private message routes
	r.GET("/api/chat/conversations", api.GetConversationsHandler)
	r.GET("/api/chat/messages", api.GetMessagesHandler)
	r.POST("/api/chat/message", api.SendMessageHandler)

	// Group message routes
	r.GET("/api/chat/group-conversations", api.GetGroupConversationsHandler)
	r.GET("/api/chat/group-messages", api.GetGroupMessagesHandler)
	r.POST("/api/chat/group-message", api.SendGroupMessageHandler)

	// Utility routes
	r.GET("/api/chat/messageable-users", api.GetMessageableUsersHandler)
}
