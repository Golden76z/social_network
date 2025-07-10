package websockets

import "time"

// BroadcastMessage sends a message to all clients or to a specific group
func (h *Hub) BroadcastMessage(message Message) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if message.GroupID != "" {
		// Broadcast to specific group
		h.broadcastToGroup(message.GroupID, message)
	} else {
		// Broadcast to all clients
		for _, client := range h.clients {
			select {
			case client.Send <- message:
			default:
				// Client's send channel is full, remove them
				go func(c *Client) {
					h.unregister <- c
				}(client)
			}
		}
	}
}

// broadcastToGroup sends a message to all members of a specific group
func (h *Hub) broadcastToGroup(groupID string, message Message) {
	group, exists := h.groups[groupID]
	if !exists {
		return
	}

	group.mu.RLock()
	defer group.mu.RUnlock()

	for _, client := range group.Members {
		select {
		case client.Send <- message:
		default:
			// Client's send channel is full, remove them
			go func(c *Client) {
				h.unregister <- c
			}(client)
		}
	}
}

// broadcastToUser sends a message to all connections of a specific user
func (h *Hub) broadcastToUser(userID int, message Message) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for _, client := range h.clients {
		if client.UserID == userID {
			select {
			case client.Send <- message:
			default:
				go func(c *Client) {
					h.unregister <- c
				}(client)
			}
		}
	}
}

// BroadcastUserList sends the current user list to all clients
func (h *Hub) BroadcastUserList() {
	h.mu.RLock()
	defer h.mu.RUnlock()

	users := make([]map[string]interface{}, 0, len(h.clients))
	for _, client := range h.clients {
		users = append(users, map[string]interface{}{
			"id":       client.UserID,
			"username": client.Username,
		})
	}

	message := Message{
		Type:      MessageTypeUserList,
		Data:      users,
		Timestamp: time.Now(),
	}

	h.broadcast <- message
}

// BroadcastGroupList sends the current group list to a specific client
func (h *Hub) BroadcastGroupList(client *Client) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	groups := make([]map[string]interface{}, 0)
	client.mu.RLock()
	for groupID, group := range client.Groups {
		groups = append(groups, map[string]interface{}{
			"id":           groupID,
			"name":         group.Name,
			"member_count": len(group.Members),
		})
	}
	client.mu.RUnlock()

	message := Message{
		Type:      MessageTypeGroupList,
		Data:      groups,
		Timestamp: time.Now(),
	}

	select {
	case client.Send <- message:
	default:
		// Client's send channel is full
		go func() {
			h.unregister <- client
		}()
	}
}
