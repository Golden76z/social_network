package routes

import "github.com/Golden76z/social-network/api"

func setupChatRoutes(r *Router) {
	r.GET("/api/chat/conversations", api.GetConversationsHandler)
	r.GET("/api/chat/messages", api.GetMessagesHandler)
	r.POST("/api/chat/message", api.SendMessageHandler)
	r.GET("/api/chat/group-messages", api.GetGroupMessagesHandler)
	r.POST("/api/chat/group-message", api.SendGroupMessageHandler)
	r.GET("/api/chat/messageable-users", api.GetMessageableUsersHandler)
}
