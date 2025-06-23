package websockets

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/websocket"
)

// WebSocket upgrader with security configurations
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// In production, check against allowed origins
		origin := r.Header.Get("Origin")
		allowedOrigins := []string{
			"https://localhost:3030",
			"https://yourdomain.com",
		}

		// For development, allow localhost connections
		env := os.Getenv("ENV")
		if env == "DEV" && (origin == "http://localhost:3000" || origin == "http://localhost:3030") {
			return true
		}

		// Check against allowed origins in production
		for _, allowed := range allowedOrigins {
			if origin == allowed {
				return true
			}
		}
		return false
	},
	// Enable compression for better performance
	EnableCompression: true,
}

// Handler creates the WebSocket HTTP handler
func Handler(hub *Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Extract user info from context (set by auth middleware)
		userID, ok := r.Context().Value("user_id").(int)
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		username, ok := r.Context().Value("username").(string)
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Upgrade connection to WebSocket
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("WebSocket upgrade error: %v", err)
			return
		}

		// Create client
		client := &Client{
			ID:       generateClientID(),
			UserID:   userID,
			Username: username,
			Conn:     conn,
			Hub:      hub,
			Send:     make(chan Message, 256),
			Rooms:    make(map[string]bool),
		}

		// Register client
		client.Hub.register <- client

		// Start goroutines for reading and writing
		go client.WritePump()
		go client.ReadPump()
	}
}

// generateClientID creates a unique client ID
func generateClientID() string {
	return time.Now().Format("20060102150405") + "-" +
		string(rune('A'+time.Now().Nanosecond()%26))
}
