package routes

import (
	"github.com/Golden76z/social-network/api"
)

func setupGroupRoutes(r *Router) {
	// Group management
	r.POST("/api/group", api.CreateGroupHandler)
	r.GET("/api/group", api.GetGroupHandler)
	r.PUT("/api/group", api.UpdateGroupHandler)
	r.DELETE("/api/group", api.DeleteGroupHandler)

	// Group posts
	r.POST("/api/group/post", api.CreateGroupPostHandler)
	r.GET("/api/group/post", api.GetGroupPostHandler)
	r.PUT("/api/group/post", api.UpdateGroupPostHandler)
	r.DELETE("/api/group/post", api.DeleteGroupPostHandler)

	// Group comments
	r.POST("/api/group/comment", api.CreateGroupCommentHandler)
	r.GET("/api/group/comment", api.GetGroupCommentHandler)
	r.PUT("/api/group/comment", api.UpdateGroupCommentHandler)
	r.DELETE("/api/group/comment", api.DeleteGroupCommentHandler)

	// Group events
	r.POST("/api/group/event", api.CreateGroupEventHandler)
	r.GET("/api/group/event", api.GetGroupEventHandler)
	r.PUT("/api/group/event", api.UpdateGroupEventHandler)
	r.DELETE("/api/group/event", api.DeleteGroupEventHandler)

	// Group membership
	r.POST("/api/group/member", api.CreateGroupMemberHandler)
	r.GET("/api/group/members", api.GetGroupMembersHandler)
	r.PUT("/api/group/member", api.UpdateGroupMemberHandler)
	r.DELETE("/api/group/member", api.DeleteGroupMemberHandler)

	// Group invitations
	r.POST("/api/group/invitation", api.CreateGroupInvitationHandler)
	r.GET("/api/group/invitation", api.GetGroupInvitationHandler)
	r.PUT("/api/group/invitation", api.UpdateGroupInvitationHandler)
	r.DELETE("/api/group/invitation", api.DeleteGroupInvitationHandler)

	// Event RSVP
	r.POST("/api/group/event/rsvp", api.RSVPToEventHandler)
	r.GET("/api/group/event/rsvp", api.GetEventRSVPsHandler)
}
