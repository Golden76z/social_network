package websockets

import (
	"database/sql"
	"log"
	"time"
)

// NewHub creates a new WebSocket hub
func NewHub(db *sql.DB) *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		rooms:      make(map[string]map[*Client]bool),
		broadcast:  make(chan Message),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		db:         db,
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
		}
	}
}

// registerClient adds a new client to the hub
func (h *Hub) RegisterClient(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	h.clients[client] = true
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
		delete(h.clients, client)
	}

	// Broadcast user list update
	h.BroadcastUserList()
}

// unregisterClient removes a client from the hub
func (h *Hub) UnregisterClient(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if _, ok := h.clients[client]; ok {
		// Remove from all rooms
		for roomID := range client.Rooms {
			h.LeaveRoom(client, roomID)
		}

		delete(h.clients, client)
		close(client.Send)

		log.Printf("Client %s (User: %s) disconnected. Total clients: %d",
			client.ID, client.Username, len(h.clients))

		// Broadcast user list update
		h.BroadcastUserList()
	}
}

// broadcastMessage sends a message to appropriate clients
func (h *Hub) BroadcastMessage(message Message) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	// If message has a room ID, only send to clients in that room
	if message.RoomID != "" {
		if room, exists := h.rooms[message.RoomID]; exists {
			for client := range room {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.clients, client)
				}
			}
		}
		return
	}

	// Broadcast to all clients
	for client := range h.clients {
		select {
		case client.Send <- message:
		default:
			close(client.Send)
			delete(h.clients, client)
		}
	}
}

// joinRoom adds a client to a room
func (h *Hub) JoinRoom(client *Client, roomID string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.rooms[roomID] == nil {
		h.rooms[roomID] = make(map[*Client]bool)
	}

	h.rooms[roomID][client] = true
	client.mu.Lock()
	client.Rooms[roomID] = true
	client.mu.Unlock()

	log.Printf("Client %s joined room %s", client.Username, roomID)
}

// leaveRoom removes a client from a room
func (h *Hub) LeaveRoom(client *Client, roomID string) {
	if room, exists := h.rooms[roomID]; exists {
		delete(room, client)
		if len(room) == 0 {
			delete(h.rooms, roomID)
		}
	}

	client.mu.Lock()
	delete(client.Rooms, roomID)
	client.mu.Unlock()

	log.Printf("Client %s left room %s", client.Username, roomID)
}

// broadcastUserList sends the current user list to all clients
func (h *Hub) BroadcastUserList() {
	users := make([]map[string]interface{}, 0, len(h.clients))

	for client := range h.clients {
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

	go func() {
		h.broadcast <- message
	}()
}
