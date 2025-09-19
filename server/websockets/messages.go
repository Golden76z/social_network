package websockets

import (
	"log"
	"strconv"

	"github.com/Golden76z/social-network/db"
)

// handlePrivateMessage handles private message websocket requests
func (c *Client) handlePrivateMessage(msg Message) {
	// Extract receiver ID from message data
	data, ok := msg.Data.(map[string]interface{})
	if !ok {
		c.sendError("Invalid message data")
		return
	}

	receiverIDFloat, ok := data["receiver_id"].(float64)
	if !ok {
		c.sendError("Missing receiver_id")
		return
	}

	receiverID := int64(receiverIDFloat)

	// Validate message content
	if len(msg.Content) == 0 || len(msg.Content) > 1000 {
		c.sendError("Message content must be between 1 and 1000 characters")
		return
	}

	// Check if user can send message to this receiver
	canSend, err := db.DBService.CheckCanSendMessage(int64(c.UserID), receiverID)
	if err != nil {
		log.Printf("Error checking message permissions: %v", err)
		c.sendError("Failed to validate message permissions")
		return
	}

	if !canSend {
		c.sendError("You cannot send messages to this user")
		return
	}

	// Create the message in database
	err = db.DBService.CreatePrivateMessage(int64(c.UserID), receiverID, msg.Content)
	if err != nil {
		log.Printf("Error creating private message: %v", err)
		c.sendError("Failed to send message")
		return
	}

	// Send message to receiver if they're online
	c.Hub.BroadcastToUser(int(receiverID), msg)

	log.Printf("Private message sent from user %d to user %d", c.UserID, receiverID)
}

// handleGroupMessage handles group message websocket requests
func (c *Client) handleGroupMessage(msg Message) {
	if msg.GroupID == "" {
		c.sendError("Group ID is required")
		return
	}

	groupID, err := strconv.ParseInt(msg.GroupID, 10, 64)
	if err != nil {
		c.sendError("Invalid group ID")
		return
	}

	// Validate message content
	if len(msg.Content) == 0 || len(msg.Content) > 1000 {
		c.sendError("Message content must be between 1 and 1000 characters")
		return
	}

	// Check if user is a member of the group
	isMember, err := db.DBService.CheckGroupMembership(int64(c.UserID), groupID)
	if err != nil {
		log.Printf("Error checking group membership: %v", err)
		c.sendError("Failed to validate group membership")
		return
	}

	if !isMember {
		c.sendError("You are not a member of this group")
		return
	}

	// Create the group message in database
	err = db.DBService.CreateGroupMessage(groupID, int64(c.UserID), msg.Content)
	if err != nil {
		log.Printf("Error creating group message: %v", err)
		c.sendError("Failed to send group message")
		return
	}

	// Broadcast message to all group members
	c.Hub.broadcast <- msg

	log.Printf("Group message sent from user %d to group %d", c.UserID, groupID)
}
