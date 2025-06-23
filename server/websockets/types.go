package websockets

import (
	"database/sql"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// Message types for different WebSocket events
const (
	MessageTypeChat     = "chat"
	MessageTypeNotify   = "notification"
	MessageTypeUserList = "user_list"
	MessageTypePing     = "ping"
	MessageTypePong     = "pong"
	MessageTypeError    = "error"
)

// Message represents a WebSocket message
type Message struct {
	Type      string      `json:"type"`
	UserID    int         `json:"user_id"`
	Username  string      `json:"username"`
	Content   string      `json:"content,omitempty"`
	Data      interface{} `json:"data,omitempty"`
	Timestamp time.Time   `json:"timestamp"`
	RoomID    string      `json:"room_id,omitempty"`
}

// Client represents a WebSocket client connection
type Client struct {
	ID       string
	UserID   int
	Username string
	Conn     *websocket.Conn
	Hub      *Hub
	Send     chan Message
	Rooms    map[string]bool // Track which rooms the client is in
	mu       sync.RWMutex
}

// Hub maintains active clients and broadcasts messages
type Hub struct {
	clients    map[*Client]bool
	rooms      map[string]map[*Client]bool // room_id -> clients
	broadcast  chan Message
	register   chan *Client
	unregister chan *Client
	db         *sql.DB
	mu         sync.RWMutex
}
