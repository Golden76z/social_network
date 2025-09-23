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
	log.Printf("🔌 Initializing WebSocket Hub")
	hubOnce.Do(func() {
		log.Printf("🔌 Creating new Hub instance")
		hubInstance = NewHub(db)
		log.Printf("🔌 Starting Hub Run() method")
		go hubInstance.Run()
		log.Printf("🔌 Starting Hub monitorHeartbeats() method")
		go hubInstance.monitorHeartbeats()
		log.Printf("🔌 Hub initialization completed")
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
		register:   make(chan *Client, 100),            // Buffered channel
		unregister: make(chan *Client, 100),            // Buffered channel
		broadcast:  make(chan Message, 1000),           // Buffered channel
		joinGroup:  make(chan *GroupJoinRequest, 100),  // Buffered channel
		leaveGroup: make(chan *GroupLeaveRequest, 100), // Buffered channel
		db:         db,                                 // Store database reference for group membership checks
	}
}

// Run starts the hub's main loop
func (h *Hub) Run() {
	log.Printf("🔌 Hub Run() method started")
	for {
		select {
		case client := <-h.register:
			log.Printf("🔌 Hub received client registration: %s (user %d)", client.ID, client.UserID)
			h.RegisterClient(client)

		case client := <-h.unregister:
			log.Printf("🔌 Hub received client unregistration: %s (user %d)", client.ID, client.UserID)
			h.UnregisterClient(client)

		case message := <-h.broadcast:
			log.Printf("🔌 Hub received broadcast message: type=%s", message.Type)
			h.BroadcastMessage(message)

		case joinReq := <-h.joinGroup:
			log.Printf("🔌 Hub received join group request: %s for group %s", joinReq.Client.ID, joinReq.GroupID)
			h.JoinGroup(joinReq.Client, joinReq.GroupID)

		case leaveReq := <-h.leaveGroup:
			log.Printf("🔌 Hub received leave group request: %s for group %s", leaveReq.Client.ID, leaveReq.GroupID)
			h.LeaveGroup(leaveReq.Client, leaveReq.GroupID)
		}
	}
}

// RegisterClient adds a new client to the hub
func (h *Hub) RegisterClient(client *Client) {
	h.mu.Lock()

	// Check for existing connections from the same user
	var existingClient *Client
	var existingID string
	for id, existing := range h.clients {
		if existing.UserID == client.UserID {
			existingClient = existing
			existingID = id
			break
		}
	}

	h.clients[client.ID] = client
	client.mu.Lock()
	client.lastHeartbeat = time.Now()
	client.mu.Unlock()
	log.Printf("✅ Client %s (User: %s) registered successfully. Total clients: %d",
		client.ID, client.Username, len(h.clients))

	h.mu.Unlock() // Release lock before calling RemoveClientFromGroup

	// Handle existing connection cleanup outside of main mutex lock
	if existingClient != nil {
		log.Printf("Closing existing connection %s for user %d, replacing with %s",
			existingID, client.UserID, client.ID)

		// Close existing connection gracefully
		existingClient.mu.Lock()
		if existingClient.Send != nil {
			close(existingClient.Send)
		}
		existingClient.mu.Unlock()

		// Remove from all groups
		existingClient.mu.RLock()
		groupIDs := make([]string, 0, len(existingClient.Groups))
		for groupID := range existingClient.Groups {
			groupIDs = append(groupIDs, groupID)
		}
		existingClient.mu.RUnlock()

		for _, groupID := range groupIDs {
			h.RemoveClientFromGroup(existingClient, groupID)
		}

		// Remove from clients map
		h.mu.Lock()
		delete(h.clients, existingID)
		h.mu.Unlock()
	}

	// Send welcome message
	welcomeMsg := Message{
		Type:      "notify", // Use string literal to match client expectations
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

func (h *Hub) monitorHeartbeats() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		h.mu.RLock()
		clients := make([]*Client, 0, len(h.clients))
		for _, c := range h.clients {
			clients = append(clients, c)
		}
		h.mu.RUnlock()

		for _, client := range clients {
			client.mu.RLock()
			last := client.lastHeartbeat
			client.mu.RUnlock()

			if time.Since(last) > 60*time.Second {
				log.Printf("Heartbeat timeout for client %s (user %d)", client.ID, client.UserID)
				h.unregister <- client
			}
		}

		// Broadcast user list every 30 seconds to keep clients updated
		if len(clients) > 0 {
			log.Printf("Periodic user list broadcast - %d clients connected", len(clients))
			go h.BroadcastUserList()
		}

		// Clean up stale connections (connections that haven't sent heartbeat for too long)
		h.cleanupStaleConnections(clients)
	}
}

// cleanupStaleConnections removes clients that haven't sent heartbeat for too long
func (h *Hub) cleanupStaleConnections(clients []*Client) {
	for _, client := range clients {
		client.mu.RLock()
		last := client.lastHeartbeat
		client.mu.RUnlock()

		// If no heartbeat for more than 2 minutes, consider connection stale
		if time.Since(last) > 2*time.Minute {
			log.Printf("Cleaning up stale connection %s (user %d) - last heartbeat: %v",
				client.ID, client.UserID, last)
			go func(c *Client) {
				h.unregister <- c
			}(client)
		}
	}
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
func (h *Hub) GetGroupMembers(groupID string) []map[string]any {
	h.mu.RLock()
	defer h.mu.RUnlock()

	group, exists := h.groups[groupID]
	if !exists {
		return nil
	}

	group.mu.RLock()
	defer group.mu.RUnlock()

	members := make([]map[string]any, 0, len(group.Members))
	for _, client := range group.Members {
		members = append(members, map[string]any{
			"id":       client.UserID,
			"username": client.Username,
		})
	}

	return members
}

// GetStats returns hub statistics
func (h *Hub) GetStats() map[string]any {
	h.mu.RLock()
	defer h.mu.RUnlock()

	return map[string]any{
		"total_clients": len(h.clients),
		"total_groups":  len(h.groups),
		"timestamp":     time.Now(),
	}
}
