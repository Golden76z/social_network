package websockets

import (
	"fmt"
	"time"
)

func (h *Hub) JoinGroup(client *Client, groupID string) error {
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
	}

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

	// Notify other group members
	h.broadcastToGroup(groupID, Message{
		Type:      "user_joined", // Use string literal to match client expectations
		GroupID:   groupID,
		UserID:    client.UserID,
		Username:  client.Username,
		Timestamp: time.Now(),
	})

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
	}
}
