package websockets

import (
	"strconv"
	"time"

	//"github.com/Golden76z/social-network/config"
	"github.com/Golden76z/social-network/db"
	"github.com/Golden76z/social-network/utils"
	"github.com/gorilla/websocket"
)

// Client message handling methods
func (c *Client) ReadPump() {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
	}()

	// Set read deadline and pong handler for heartbeat
	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		var msg Message
		err := c.Conn.ReadJSON(&msg)
		if err != nil {
			break
		}

		// Add client info to message
		msg.UserID = c.UserID
		msg.Username = c.Username
		msg.Timestamp = time.Now()

		c.mu.Lock()
		c.lastHeartbeat = time.Now()
		c.mu.Unlock()

		// Handle different message types
		switch msg.Type {
		case "chat":
			// Cap content of the message to 1000 length
			if len(msg.Content) > 1000 {
				msg.Content = msg.Content[:1000]
			}
			// Validate group membership if message is for a group
			if msg.GroupID != "" {
				if !c.isInGroup(msg.GroupID) {
					c.sendError("You are not a member of this group")
					continue
				}
			}
			c.Hub.broadcast <- msg

		case "private_message":
			// Handle private message
			c.handlePrivateMessage(msg)

		case "group_message":
			// Handle group message
			c.handleGroupMessage(msg)

		case "ping":
			// Validate session and respond with pong
			c.handlePing(msg)

		case "join_group":
			// Handle join group request
			c.handleJoinGroup(msg)

		case "leave_group":
			// Handle leave group request
			c.handleLeaveGroup(msg)

		case "get_group_members":
			// Handle get group members request
			c.handleGetGroupMembers(msg)

		default:
			// Unknown message type - silently ignore
		}
	}
}

func (c *Client) WritePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.Conn.WriteJSON(message); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// handlePing validates JWT and session, then responds with pong
func (c *Client) handlePing(msg Message) {
	// Extract JWT from the ping message (client should send it)
	tokenString, ok := msg.Data.(string)
	if !ok {
		c.sendError("Invalid ping format - missing JWT token")
		return
	}

	// Validate JWT token
	//cfg := config.GetConfig()
	claims, err := utils.ValidateToken(tokenString)
	if err != nil {
		c.sendError("Invalid JWT token")
		// Disconnect client with invalid token
		go func() {
			c.Hub.unregister <- c
		}()
		return
	}

	// Extract user ID from claims
	userID := claims.UserID

	// Check if the user ID matches the client's user ID
	if userID != c.UserID {
		c.sendError("JWT user mismatch")
		go func() {
			c.Hub.unregister <- c
		}()
		return
	}

	_, errToken := utils.ValidateToken(tokenString)
	if errToken != nil {
		c.sendError("Invalid session")
		go func() {
			c.Hub.unregister <- c
		}()
		return
	}

	// Send pong response
	pongMsg := Message{
		Type:      "pong", // Use string literal to match client expectations
		Timestamp: time.Now(),
		Data:      "pong",
	}

	c.mu.Lock()
	c.lastHeartbeat = time.Now()
	c.mu.Unlock()

	select {
	case c.Send <- pongMsg:
	default:
		// Send channel is full, disconnect client
		go func() {
			c.Hub.unregister <- c
		}()
	}
}

// handleJoinGroup handles group join requests
func (c *Client) handleJoinGroup(msg Message) {
	groupID, ok := msg.Data.(string)
	if !ok {
		c.sendError("Invalid group ID format")
		return
	}

	joinReq := &GroupJoinRequest{
		Client:  c,
		GroupID: groupID,
	}

	select {
	case c.Hub.joinGroup <- joinReq:
	default:
		c.sendError("Server busy, try again later")
	}
}

// handleLeaveGroup handles group leave requests
func (c *Client) handleLeaveGroup(msg Message) {
	groupID, ok := msg.Data.(string)
	if !ok {
		c.sendError("Invalid group ID format")
		return
	}

	leaveReq := &GroupLeaveRequest{
		Client:  c,
		GroupID: groupID,
	}

	select {
	case c.Hub.leaveGroup <- leaveReq:
	default:
		c.sendError("Server busy, try again later")
	}
}

// handleGetGroupMembers handles requests to get group member list
func (c *Client) handleGetGroupMembers(msg Message) {
	groupID, ok := msg.Data.(string)
	if !ok {
		c.sendError("Invalid group ID format")
		return
	}

	// Check if client is in the group
	if !c.isInGroup(groupID) {
		c.sendError("You are not a member of this group")
		return
	}

	members := c.Hub.GetGroupMembers(groupID)
	response := Message{
		Type:      "group_members", // Use string literal to match client expectations
		GroupID:   groupID,
		Data:      members,
		Timestamp: time.Now(),
	}

	select {
	case c.Send <- response:
	default:
		// Send channel is full
		go func() {
			c.Hub.unregister <- c
		}()
	}
}

// isInGroup checks if the client is a member of the specified group
func (c *Client) isInGroup(groupID string) bool {
	c.mu.RLock()
	defer c.mu.RUnlock()

	_, exists := c.Groups[groupID]
	return exists
}

// sendError sends an error message to the client
func (c *Client) sendError(errorMsg string) {
	errMsg := Message{
		Type:      "error", // Use string literal to match client expectations
		Content:   errorMsg,
		Timestamp: time.Now(),
	}

	select {
	case c.Send <- errMsg:
	default:
		// Send channel is full, disconnect client
		go func() {
			c.Hub.unregister <- c
		}()
	}
}

// sendNotification sends a notification message to the client
func (c *Client) sendNotification(content string, notificationType string, data map[string]any) {
	notifyMsg := Message{
		Type:      "notification", // Use string literal to match client expectations
		Content:   content,
		Timestamp: time.Now(),
		Data: map[string]any{
			"type": notificationType,
			"data": data,
		},
	}

	select {
	case c.Send <- notifyMsg:
	default:
		// Send channel is full
		go func() {
			c.Hub.unregister <- c
		}()
	}
}

// handlePrivateMessage handles private message requests
func (c *Client) handlePrivateMessage(msg Message) {
	// Extract receiver ID from message data
	data, ok := msg.Data.(map[string]interface{})
	if !ok {
		c.sendError("Invalid private message format")
		return
	}

	receiverIDFloat, ok := data["receiver_id"].(float64)
	if !ok {
		c.sendError("Invalid receiver_id")
		return
	}
	receiverID := int(receiverIDFloat)

	// Validate message content
	if msg.Content == "" || len(msg.Content) > 1000 {
		c.sendError("Message content must be between 1 and 1000 characters")
		return
	}

	// Save message to database
	messageID, err := db.DBService.CreatePrivateMessage(c.UserID, receiverID, msg.Content)
	if err != nil {
		c.sendError("Failed to save message")
		return
	}

	// Send message to the specific receiver
	message := Message{
		Type:      "private_message", // Use string literal to match client expectations
		Content:   msg.Content,
		UserID:    c.UserID,
		Username:  c.Username,
		Timestamp: time.Now(),
		MessageID: messageID,
		Data: map[string]interface{}{
			"sender_id":   c.UserID,
			"receiver_id": receiverID,
		},
	}

	// Broadcast to the specific user
	c.Hub.BroadcastToUser(receiverID, message)

	ackMsg := Message{
		Type:      "private_message_ack", // Use string literal to match client expectations
		MessageID: messageID,
		Timestamp: time.Now(),
		Data: map[string]any{
			"receiver_id": receiverID,
			"body":        msg.Content,
		},
	}

	select {
	case c.Send <- ackMsg:
	default:
		// Send channel is full
	}

	updatePayloadSender := Message{
		Type:      "conversation_update", // Use string literal to match client expectations
		Timestamp: time.Now(),
		Data: map[string]any{
			"conversation_type": "private",
			"user_id":           receiverID,
			"last_message":      msg.Content,
			"last_message_time": time.Now(),
		},
	}

	updatePayloadReceiver := Message{
		Type:      "conversation_update", // Use string literal to match client expectations
		Timestamp: time.Now(),
		Data: map[string]any{
			"conversation_type": "private",
			"user_id":           c.UserID,
			"last_message":      msg.Content,
			"last_message_time": time.Now(),
		},
	}

	c.Hub.BroadcastToUser(c.UserID, updatePayloadSender)
	c.Hub.BroadcastToUser(receiverID, updatePayloadReceiver)
}

// handleGroupMessage handles group message requests
func (c *Client) handleGroupMessage(msg Message) {
	// Validate group membership
	if msg.GroupID == "" {
		c.sendError("Group ID is required")
		return
	}

	if !c.isInGroup(msg.GroupID) {
		c.sendError("You are not a member of this group")
		return
	}

	// Validate message content
	if msg.Content == "" || len(msg.Content) > 1000 {
		c.sendError("Message content must be between 1 and 1000 characters")
		return
	}

	// Parse group ID
	groupID, err := strconv.Atoi(msg.GroupID)
	if err != nil {
		c.sendError("Invalid group ID")
		return
	}

	// Save message to database
	messageID, err := db.DBService.CreateGroupMessage(groupID, c.UserID, msg.Content)
	if err != nil {
		c.sendError("Failed to save message")
		return
	}

	// Broadcast to the group
	message := Message{
		Type:      "group_message", // Use string literal to match client expectations
		Content:   msg.Content,
		GroupID:   msg.GroupID,
		UserID:    c.UserID,
		Username:  c.Username,
		Timestamp: time.Now(),
		MessageID: messageID,
	}

	c.Hub.BroadcastMessage(message)

	ackMsg := Message{
		Type:      "group_message_ack", // Use string literal to match client expectations
		GroupID:   msg.GroupID,
		MessageID: messageID,
		Timestamp: time.Now(),
		Data: map[string]any{
			"body": msg.Content,
		},
	}

	select {
	case c.Send <- ackMsg:
	default:
		// Send channel is full
	}

	updatePayload := Message{
		Type:      "conversation_update", // Use string literal to match client expectations
		Timestamp: time.Now(),
		GroupID:   msg.GroupID,
		Data: map[string]any{
			"conversation_type": "group",
			"group_id":          msg.GroupID,
			"last_message":      msg.Content,
			"last_message_time": time.Now(),
		},
	}

	c.Hub.BroadcastMessage(updatePayload)
}

// GetClientInfo returns basic client information
func (c *Client) GetClientInfo() map[string]any {
	c.mu.RLock()
	defer c.mu.RUnlock()

	groups := make([]string, 0, len(c.Groups))
	for groupID := range c.Groups {
		groups = append(groups, groupID)
	}

	return map[string]any{
		"id":        c.ID,
		"user_id":   c.UserID,
		"username":  c.Username,
		"groups":    groups,
		"connected": time.Now(),
	}
}
