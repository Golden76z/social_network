package websockets

import (
	"log"
	"time"
)

// BroadcastMessage sends a message to all clients or to a specific group
func (h *Hub) BroadcastMessage(message Message) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	log.Printf("🔌 GROUP_BROADCAST: Broadcasting message: type=%s, groupID=%s, content=%s", message.Type, message.GroupID, message.Content)

	if message.GroupID != "" {
		// Broadcast to specific group
		log.Printf("🔌 GROUP_BROADCAST: Broadcasting to group %s", message.GroupID)
		h.broadcastToGroup(message.GroupID, message)
	} else {
		// Broadcast to all clients
		log.Printf("🔌 GROUP_BROADCAST: Broadcasting to all clients (%d clients)", len(h.clients))
		for _, client := range h.clients {
			select {
			case client.Send <- message:
				log.Printf("🔌 GROUP_BROADCAST: Message sent to client %s (user %d)", client.ID, client.UserID)
			default:
				// Client's send channel is full, remove them
				log.Printf("🔌 GROUP_BROADCAST: Client %s send channel full, removing", client.ID)
				go func(c *Client) {
					h.unregister <- c
				}(client)
			}
		}
	}
}

// broadcastToGroup sends a message to all members of a specific group
func (h *Hub) broadcastToGroup(groupID string, message Message) {
	log.Printf("🔌 GROUP_BROADCAST: Attempting to broadcast to group %s", groupID)

	group, exists := h.groups[groupID]
	if !exists {
		log.Printf("🔌 GROUP_BROADCAST: Group %s does not exist in hub", groupID)
		return
	}

	group.mu.RLock()
	defer group.mu.RUnlock()

	log.Printf("🔌 GROUP_BROADCAST: Broadcasting to group %s with %d members", groupID, len(group.Members))
	for _, client := range group.Members {
		select {
		case client.Send <- message:
			log.Printf("🔌 GROUP_BROADCAST: Message sent to group member %s (user %d)", client.ID, client.UserID)
		default:
			// Client's send channel is full, remove them
			log.Printf("🔌 GROUP_BROADCAST: Group member %s send channel full, removing", client.ID)
			go func(c *Client) {
				h.unregister <- c
			}(client)
		}
	}
	log.Printf("🔌 GROUP_BROADCAST: Completed broadcasting to group %s", groupID)
}

// broadcastToUser sends a message to all connections of a specific user
func (h *Hub) BroadcastToUser(userID int, message Message) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	log.Printf("Broadcasting to user %d: type=%s, content=%s", userID, message.Type, message.Content)
	for _, client := range h.clients {
		if client.UserID == userID {
			select {
			case client.Send <- message:
				log.Printf("Message sent to user %d client %s", userID, client.ID)
			default:
				log.Printf("User %d client %s send channel full, removing", userID, client.ID)
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

	users := make([]map[string]any, 0, len(h.clients))
	for _, client := range h.clients {
		users = append(users, map[string]any{
			"id":       client.UserID,
			"username": client.Username,
		})
	}

	message := Message{
		Type:      "user_list", // Use string literal to match client expectations
		Data:      users,
		Timestamp: time.Now(),
	}

	log.Printf("Broadcasting user list to %d clients with %d users", len(h.clients), len(users))
	h.broadcast <- message
}

// BroadcastGroupList sends the current group list to a specific client
func (h *Hub) BroadcastGroupList(client *Client) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	groups := make([]map[string]any, 0)
	client.mu.RLock()
	for groupID, group := range client.Groups {
		groups = append(groups, map[string]any{
			"id":           groupID,
			"name":         group.Name,
			"member_count": len(group.Members),
		})
	}
	client.mu.RUnlock()

	message := Message{
		Type:      "group_list", // Use string literal to match client expectations
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

// BroadcastNotification sends a notification to a specific user
func (h *Hub) BroadcastNotification(userID int, notificationType, content string, data map[string]any) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	message := Message{
		Type:      "notification",
		Content:   content,
		Timestamp: time.Now(),
		Data: map[string]any{
			"type": notificationType,
			"data": data,
		},
	}

	log.Printf("Broadcasting notification to user %d: type=%s, content=%s", userID, notificationType, content)

	for _, client := range h.clients {
		if client.UserID == userID {
			select {
			case client.Send <- message:
				log.Printf("Notification sent to user %d client %s", userID, client.ID)
			default:
				log.Printf("User %d client %s send channel full, removing", userID, client.ID)
				go func(c *Client) {
					h.unregister <- c
				}(client)
			}
		}
	}
}
