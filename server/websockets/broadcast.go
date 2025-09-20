package websockets

import (
	"log"
	"time"
)

// BroadcastMessage sends a message to all clients or to a specific group
func (h *Hub) BroadcastMessage(message Message) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	log.Printf("Broadcasting message: type=%s, groupID=%s, content=%s", message.Type, message.GroupID, message.Content)

	if message.GroupID != "" {
		// Broadcast to specific group
		log.Printf("Broadcasting to group %s", message.GroupID)
		h.broadcastToGroup(message.GroupID, message)
	} else {
		// Broadcast to all clients
		log.Printf("Broadcasting to all clients (%d clients)", len(h.clients))
		for _, client := range h.clients {
			select {
			case client.Send <- message:
				log.Printf("Message sent to client %s (user %d)", client.ID, client.UserID)
			default:
				// Client's send channel is full, remove them
				log.Printf("Client %s send channel full, removing", client.ID)
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
		log.Printf("Group %s does not exist in hub", groupID)
		return
	}

	group.mu.RLock()
	defer group.mu.RUnlock()

	log.Printf("Broadcasting to group %s with %d members", groupID, len(group.Members))
	for _, client := range group.Members {
		select {
		case client.Send <- message:
			log.Printf("Message sent to group member %s (user %d)", client.ID, client.UserID)
		default:
			// Client's send channel is full, remove them
			log.Printf("Group member %s send channel full, removing", client.ID)
			go func(c *Client) {
				h.unregister <- c
			}(client)
		}
	}
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
