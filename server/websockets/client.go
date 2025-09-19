package websockets

import (
	"log"
	"time"

	//"github.com/Golden76z/social-network/config"
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
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		// Add client info to message
		msg.UserID = c.UserID
		msg.Username = c.Username
		msg.Timestamp = time.Now()

		// Handle different message types
		switch msg.Type {
		case MessageTypeChat:
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

		case MessageTypePrivateMessage:
			// Handle private message
			c.handlePrivateMessage(msg)

		case MessageTypeGroupMessage:
			// Handle group message
			c.handleGroupMessage(msg)

		case MessageTypePing:
			// Validate session and respond with pong
			c.handlePing(msg)

		case MessageTypeJoinGroup:
			// Handle join group request
			c.handleJoinGroup(msg)

		case MessageTypeLeaveGroup:
			// Handle leave group request
			c.handleLeaveGroup(msg)

		case MessageTypeGetGroupMembers:
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
			if err := c.Conn.WriteJSON(message); err != nil {
				log.Printf("WebSocket write error: %v", err)
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
		Type:      "MessageTypePong",
		Timestamp: time.Now(),
		Data:      "pong",
	}

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
		Type:      "MessageTypeGroupMembers",
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
		Type:      "MessageTypeError",
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
// func (c *Client) sendNotification(content string) {
// 	notifyMsg := Message{
// 		Type:      MessageTypeNotify,
// 		Content:   content,
// 		Timestamp: time.Now(),
// 	}

// 	select {
// 	case c.Send <- notifyMsg:
// 	default:
// 		// Send channel is full
// 		log.Printf("Failed to send notification to client %s", c.ID)
// 	}
// }

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
