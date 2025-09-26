package websockets

import (
	"database/sql"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// Message types for different WebSocket events
const (
	MessageTypeChat               = "chat"
	MessageTypePing               = "ping"
	MessageTypePong               = "pong"
	MessageTypeError              = "error"
	MessageTypeNotify             = "notify"
	MessageTypeUserList           = "user_list"
	MessageTypeGroupList          = "group_list"
	MessageTypeUserJoined         = "user_joined"
	MessageTypeUserLeft           = "user_left"
	MessageTypeJoinGroup          = "join_group"
	MessageTypeLeaveGroup         = "leave_group"
	MessageTypeGetGroupMembers    = "get_group_members"
	MessageTypeGroupMembers       = "group_members"
	MessageTypePrivateMessage     = "private_message"
	MessageTypeGroupMessage       = "group_message"
	MessageTypeConversationUpdate = "conversation_update"
	MessageTypePrivateMessageAck  = "private_message_ack"
	MessageTypeGroupMessageAck    = "group_message_ack"
)

// Message represents a WebSocket message
type Message struct {
	Type      string    `json:"type"`
	Content   string    `json:"content,omitempty"`
	GroupID   string    `json:"group_id,omitempty"`
	UserID    int       `json:"user_id"`
	Username  string    `json:"username"`
	MessageID int64     `json:"message_id,omitempty"`
	Timestamp time.Time `json:"timestamp"`
	Data      any       `json:"data,omitempty"`
}

// Client represents a WebSocket client connection
type Client struct {
	ID       string
	UserID   int
	Username string
	Conn     *websocket.Conn
	Hub      *Hub
	Send     chan Message
	Groups   map[string]*Group
	// heartbeat
	lastHeartbeat time.Time
	// For thread-safe access to Groups
	mu sync.RWMutex
}

// Group represents a chat group/room
type Group struct {
	ID        string
	Name      string
	Members   map[string]*Client
	Broadcast chan Message
	CreatedAt time.Time
	mu        sync.RWMutex
}

// Hub maintains active clients and broadcasts messages
type Hub struct {
	clients    map[string]*Client
	groups     map[string]*Group
	register   chan *Client
	unregister chan *Client
	broadcast  chan Message
	joinGroup  chan *GroupJoinRequest
	leaveGroup chan *GroupLeaveRequest
	db         *sql.DB // Database reference for group membership checks
	mu         sync.RWMutex
}

type GroupJoinRequest struct {
	Client  *Client
	GroupID string
}

type GroupLeaveRequest struct {
	Client  *Client
	GroupID string
}
