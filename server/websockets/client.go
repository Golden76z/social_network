package websockets

import (
	"log"
	"strconv"
	"time"

	//"github.com/Golden76z/social-network/config"
	"github.com/Golden76z/social-network/db"
	"github.com/Golden76z/social-network/utils"
	"github.com/gorilla/websocket"
)

// Client message handling methods
func (c *Client) ReadPump() {
	log.Printf("🔌 ReadPump started for client %s (user %d)", c.ID, c.UserID)
	defer func() {
		log.Printf("🔌 ReadPump stopping for client %s (user %d)", c.ID, c.UserID)
		c.Hub.unregister <- c
		c.Conn.Close()
	}()

	// Set read deadline and pong handler for heartbeat
	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		log.Printf("🔍 Received pong from user %d", c.UserID)
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		var msg Message
		err := c.Conn.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
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
			log.Printf("Unknown message type: %s", msg.Type)
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
			// Removed WebSocket logging
			if err := c.Conn.WriteJSON(message); err != nil {
				log.Printf("❌ WebSocket write error: %v", err)
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
		log.Printf("Ping message data type: %T, value: %v", msg.Data, msg.Data)
		c.sendError("Invalid ping format - missing JWT token")
		return
	}

	log.Printf("Received ping from user %d, validating token", c.UserID)

	// Validate JWT token
	//cfg := config.GetConfig()
	claims, err := utils.ValidateToken(tokenString)
	if err != nil {
		c.sendError("Invalid JWT token")
		log.Printf("JWT validation failed for client %s: %v", c.ID, err)
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
		log.Printf("JWT user mismatch for client %s: expected %d, got %d", c.ID, c.UserID, userID)
		go func() {
			c.Hub.unregister <- c
		}()
		return
	}

	_, errToken := utils.ValidateToken(tokenString)
	if errToken != nil {
		c.sendError("Invalid session")
		log.Printf("Session validation failed for client %s, user %d", c.ID, int(userID))
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

	log.Printf("Sending pong response to user %d", c.UserID)
	select {
	case c.Send <- pongMsg:
		log.Printf("Pong sent successfully to user %d", c.UserID)
	default:
		// Send channel is full, disconnect client
		log.Printf("Send channel full for user %d, disconnecting", c.UserID)
		go func() {
			c.Hub.unregister <- c
		}()
	}
}

// handleJoinGroup handles group join requests
func (c *Client) handleJoinGroup(msg Message) {
	log.Printf("🔌 GROUP_JOIN: User %d requesting to join group", c.UserID)

	groupID, ok := msg.Data.(string)
	if !ok {
		log.Printf("🔌 GROUP_JOIN: Invalid group ID format from user %d", c.UserID)
		c.sendError("Invalid group ID format")
		return
	}

	log.Printf("🔌 GROUP_JOIN: User %d joining group %s", c.UserID, groupID)

	joinReq := &GroupJoinRequest{
		Client:  c,
		GroupID: groupID,
	}

	select {
	case c.Hub.joinGroup <- joinReq:
		log.Printf("🔌 GROUP_JOIN: Join request sent for user %d to group %s", c.UserID, groupID)
	default:
		log.Printf("🔌 GROUP_JOIN: Server busy, cannot process join request for user %d", c.UserID)
		c.sendError("Server busy, try again later")
	}
}

// handleLeaveGroup handles group leave requests
func (c *Client) handleLeaveGroup(msg Message) {
	log.Printf("🔌 GROUP_LEAVE: User %d requesting to leave group", c.UserID)

	groupID, ok := msg.Data.(string)
	if !ok {
		log.Printf("🔌 GROUP_LEAVE: Invalid group ID format from user %d", c.UserID)
		c.sendError("Invalid group ID format")
		return
	}

	log.Printf("🔌 GROUP_LEAVE: User %d leaving group %s", c.UserID, groupID)

	leaveReq := &GroupLeaveRequest{
		Client:  c,
		GroupID: groupID,
	}

	select {
	case c.Hub.leaveGroup <- leaveReq:
		log.Printf("🔌 GROUP_LEAVE: Leave request sent for user %d from group %s", c.UserID, groupID)
	default:
		log.Printf("🔌 GROUP_LEAVE: Server busy, cannot process leave request for user %d", c.UserID)
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
		log.Printf("Notification sent to client %s (user %d): %s", c.ID, c.UserID, content)
	default:
		// Send channel is full
		log.Printf("Failed to send notification to client %s - send channel full", c.ID)
		go func() {
			c.Hub.unregister <- c
		}()
	}
}

// handlePrivateMessage handles private message requests
func (c *Client) handlePrivateMessage(msg Message) {
	log.Printf("🔍 handlePrivateMessage called for user %d with data: %+v", c.UserID, msg.Data)

	// Extract receiver ID from message data
	data, ok := msg.Data.(map[string]interface{})
	if !ok {
		log.Printf("❌ Invalid private message format - data is not map[string]interface{}: %T", msg.Data)
		c.sendError("Invalid private message format")
		return
	}

	receiverIDFloat, ok := data["receiver_id"].(float64)
	if !ok {
		log.Printf("❌ Invalid receiver_id - not float64: %T, value: %v", data["receiver_id"], data["receiver_id"])
		c.sendError("Invalid receiver_id")
		return
	}
	receiverID := int(receiverIDFloat)
	log.Printf("🔍 Extracted receiver_id: %d", receiverID)

	// Validate message content
	if msg.Content == "" || len(msg.Content) > 1000 {
		c.sendError("Message content must be between 1 and 1000 characters")
		return
	}

	// Save message to database
	log.Printf("🔍 Saving private message to database: sender=%d, receiver=%d, content='%s'", c.UserID, receiverID, msg.Content)
	messageID, err := db.DBService.CreatePrivateMessage(c.UserID, receiverID, msg.Content)
	if err != nil {
		log.Printf("❌ Failed to save private message: %v", err)
		c.sendError("Failed to save message")
		return
	}
	log.Printf("✅ Private message saved with ID: %d", messageID)

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

	log.Printf("Broadcasting private message from user %d to user %d", c.UserID, receiverID)

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

	log.Printf("🔍 Sending acknowledgment to sender (user %d): %+v", c.UserID, ackMsg)
	select {
	case c.Send <- ackMsg:
		log.Printf("✅ Acknowledgment sent successfully to sender (user %d)", c.UserID)
	default:
		log.Printf("❌ Failed to send ack to sender (user %d) - send channel full", c.UserID)
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
	log.Printf("🔌 GROUP_MSG: Handling group message from user %d: %s", c.UserID, msg.Content)

	// Validate group membership
	if msg.GroupID == "" {
		log.Printf("🔌 GROUP_MSG: Group ID is required")
		c.sendError("Group ID is required")
		return
	}

	if !c.isInGroup(msg.GroupID) {
		log.Printf("🔌 GROUP_MSG: User %d is not a member of group %s", c.UserID, msg.GroupID)
		c.sendError("You are not a member of this group")
		return
	}

	log.Printf("🔌 GROUP_MSG: User %d is member of group %s", c.UserID, msg.GroupID)

	// Validate message content
	if msg.Content == "" || len(msg.Content) > 1000 {
		log.Printf("🔌 GROUP_MSG: Invalid message content length: %d", len(msg.Content))
		c.sendError("Message content must be between 1 and 1000 characters")
		return
	}

	// Parse group ID
	groupID, err := strconv.Atoi(msg.GroupID)
	if err != nil {
		log.Printf("🔌 GROUP_MSG: Invalid group ID format: %s", msg.GroupID)
		c.sendError("Invalid group ID")
		return
	}

	log.Printf("🔌 GROUP_MSG: Parsed group ID: %d", groupID)

	// Save message to database
	messageID, err := db.DBService.CreateGroupMessage(groupID, c.UserID, msg.Content)
	if err != nil {
		log.Printf("🔌 GROUP_MSG: Failed to save group message: %v", err)
		c.sendError("Failed to save message")
		return
	}

	log.Printf("🔌 GROUP_MSG: Saved message to DB with ID: %d", messageID)

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

	log.Printf("🔌 GROUP_MSG: Broadcasting group message from user %d to group %s", c.UserID, msg.GroupID)
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

	log.Printf("🔌 GROUP_MSG: Sending ack to sender user %d", c.UserID)
	select {
	case c.Send <- ackMsg:
		log.Printf("🔌 GROUP_MSG: Ack sent successfully to user %d", c.UserID)
	default:
		log.Printf("🔌 GROUP_MSG: Failed to send group ack to sender (user %d) - send channel full", c.UserID)
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
