package websockets

import (
	"fmt"
	"log"
	"time"
)

func (h *Hub) JoinGroup(client *Client, groupID string) error {
	log.Printf("🔌 GROUP_JOIN: Processing join request for user %d to group %s", client.UserID, groupID)

	h.mu.Lock()
	defer h.mu.Unlock()

	group, exists := h.groups[groupID]
	if !exists {
		// Create the group if it doesn't exist
		group = &Group{
			ID:        groupID,
			Name:      fmt.Sprintf("Group %s", groupID),
			Members:   make(map[string]*Client),
			Broadcast: make(chan Message, 256),
			CreatedAt: time.Now(),
		}
		h.groups[groupID] = group
		log.Printf("🔌 GROUP_JOIN: Created new group %s in websocket hub", groupID)
	}

	log.Printf("🔌 GROUP_JOIN: Group %s exists with %d members", groupID, len(group.Members))

	// Check if user has permission to join
	// if !h.canJoinGroup(client.UserID, groupID) {
	// 	return fmt.Errorf("user %d not authorized to join group %s", client.UserID, groupID)
	// }

	// Add client to group
	group.Members[client.ID] = client

	// Add group to client's groups
	client.mu.Lock()
	client.Groups[groupID] = group
	client.mu.Unlock()

	log.Printf("🔌 GROUP_JOIN: User %d joined group %s. Group now has %d members", client.UserID, groupID, len(group.Members))

	// Notify other group members
	h.broadcastToGroup(groupID, Message{
		Type:      "user_joined", // Use string literal to match client expectations
		GroupID:   groupID,
		UserID:    client.UserID,
		Username:  client.Username,
		Timestamp: time.Now(),
	})

	log.Printf("🔌 GROUP_JOIN: Successfully joined user %d to group %s", client.UserID, groupID)
	return nil
}

func (h *Hub) LeaveGroup(client *Client, groupID string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	group, exists := h.groups[groupID]
	if !exists {
		return
	}

	// Remove client from group
	delete(group.Members, client.ID)

	// Remove group from client's groups
	client.mu.Lock()
	delete(client.Groups, groupID)
	client.mu.Unlock()

	// Notify other group members
	h.broadcastToGroup(groupID, Message{
		Type:      "user_left", // Use string literal to match client expectations
		GroupID:   groupID,
		UserID:    client.UserID,
		Username:  client.Username,
		Timestamp: time.Now(),
	})
}

// removeClientFromGroup is a helper function to remove a client from a group
func (h *Hub) RemoveClientFromGroup(client *Client, groupID string) {
	group, exists := h.groups[groupID]
	if !exists {
		return
	}

	// Remove client from group
	group.mu.Lock()
	delete(group.Members, client.ID)
	groupEmpty := len(group.Members) == 0
	group.mu.Unlock()

	// Remove group from client's groups
	client.mu.Lock()
	delete(client.Groups, groupID)
	client.mu.Unlock()

	// Notify other group members
	h.broadcastToGroup(groupID, Message{
		Type:      "user_left", // Use string literal to match client expectations
		GroupID:   groupID,
		UserID:    client.UserID,
		Username:  client.Username,
		Timestamp: time.Now(),
	})

	// Clean up empty groups
	if groupEmpty {
		delete(h.groups, groupID)
		log.Printf("Group %s removed (empty)", groupID)
	}

	log.Printf("Client %s left group %s", client.ID, groupID)
}
