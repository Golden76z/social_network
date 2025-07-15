package websockets

import (
	"database/sql"
	"log"
	"sync"
	"time"

	"github.com/Golden76z/social-network/db"
)

var (
	hubInstance *Hub
	hubOnce     sync.Once
)

// InitHub initializes the global singleton hub
func InitHub(db *sql.DB) {
	hubOnce.Do(func() {
		hubInstance = NewHub(db)
		go hubInstance.Run()
	})
}

// GetHub returns the singleton hub instance
func GetHub() *Hub {
	return hubInstance
}

// NewHub creates a new WebSocket hub
func NewHub(db *sql.DB) *Hub {
	return &Hub{
		clients:    make(map[string]*Client),
		groups:     make(map[string]*Group),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan Message),
		joinGroup:  make(chan *GroupJoinRequest),
		leaveGroup: make(chan *GroupLeaveRequest),
	}
}

// Run starts the hub's main loop
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.RegisterClient(client)

		case client := <-h.unregister:
			h.UnregisterClient(client)

		case message := <-h.broadcast:
			h.BroadcastMessage(message)

		case joinReq := <-h.joinGroup:
			h.JoinGroup(joinReq.Client, joinReq.GroupID)

		case leaveReq := <-h.leaveGroup:
			h.LeaveGroup(leaveReq.Client, leaveReq.GroupID)
		}
	}
}

// RegisterClient adds a new client to the hub
func (h *Hub) RegisterClient(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	h.clients[client.ID] = client
	log.Printf("Client %s (User: %s) connected. Total clients: %d",
		client.ID, client.Username, len(h.clients))

	// Send welcome message
	welcomeMsg := Message{
		Type:      MessageTypeNotify,
		Content:   "Connected to server",
		Timestamp: time.Now(),
	}

	select {
	case client.Send <- welcomeMsg:
	default:
		close(client.Send)
		delete(h.clients, client.ID)
		return
	}

	// Auto-join user to their groups
	h.autoJoinUserGroups(client)

	// Broadcast user list update
	go h.BroadcastUserList()
}

// UnregisterClient removes a client from the hub
func (h *Hub) UnregisterClient(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if _, exists := h.clients[client.ID]; !exists {
		return
	}

	// Remove client from all groups
	client.mu.RLock()
	groupIDs := make([]string, 0, len(client.Groups))
	for groupID := range client.Groups {
		groupIDs = append(groupIDs, groupID)
	}
	client.mu.RUnlock()

	for _, groupID := range groupIDs {
		h.RemoveClientFromGroup(client, groupID)
	}

	// Remove client from hub
	delete(h.clients, client.ID)
	close(client.Send)

	log.Printf("Client %s (User: %s) disconnected. Total clients: %d",
		client.ID, client.Username, len(h.clients))

	// Broadcast user list update
	go h.BroadcastUserList()
}

// autoJoinUserGroups automatically joins a user to their groups when they connect
func (h *Hub) autoJoinUserGroups(client *Client) {
	userGroups, err := db.DBService.GetUserGroups(client.UserID)
	if err != nil {
		log.Printf("Error fetching user groups for user %d: %v", client.UserID, err)
		return
	}

	for _, groupID := range userGroups {
		if err := h.JoinGroup(client, groupID); err != nil {
			log.Printf("Error joining group %s for user %d: %v", groupID, client.UserID, err)
		}
	}
}

// // canJoinGroup checks if a user has permission to join a group
// func (h *Hub) canJoinGroup(userID int, groupID string) bool {
// 	query := `
// 		SELECT COUNT(*) FROM group_members
// 		WHERE user_id = ? AND group_id = ? AND status = 'active'
// 	`

// 	var count int
// 	err := h.db.QueryRow(query, userID, groupID).Scan(&count)
// 	if err != nil {
// 		log.Printf("Error checking group membership: %v", err)
// 		return false
// 	}

// 	return count > 0
// }

// GetGroupMembers returns the list of members in a group
func (h *Hub) GetGroupMembers(groupID string) []map[string]interface{} {
	h.mu.RLock()
	defer h.mu.RUnlock()

	group, exists := h.groups[groupID]
	if !exists {
		return nil
	}

	group.mu.RLock()
	defer group.mu.RUnlock()

	members := make([]map[string]interface{}, 0, len(group.Members))
	for _, client := range group.Members {
		members = append(members, map[string]interface{}{
			"id":       client.UserID,
			"username": client.Username,
		})
	}

	return members
}

// GetStats returns hub statistics
func (h *Hub) GetStats() map[string]interface{} {
	h.mu.RLock()
	defer h.mu.RUnlock()

	return map[string]interface{}{
		"total_clients": len(h.clients),
		"total_groups":  len(h.groups),
		"timestamp":     time.Now(),
	}
}
