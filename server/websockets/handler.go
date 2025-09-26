package websockets

import (
	"log"
	"net/http"
	"os"
	"slices"
	"strings"
	"time"

	"github.com/Golden76z/social-network/config"
	"github.com/Golden76z/social-network/db"
	"github.com/Golden76z/social-network/utils"
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
			"http://localhost:3000",
			"http://127.0.0.1:3000",
		}

		// For development, allow localhost connections
		env := os.Getenv("ENV")
		if env == "DEV" || env == "DEVELOPMENT" || env == "" {
			if origin == "" {
				return true
			}
			if strings.HasPrefix(origin, "http://localhost") || strings.HasPrefix(origin, "http://127.0.0.1") {
				return true
			}
		}

		// Check against allowed origins in production
		return slices.Contains(allowedOrigins, origin)
	},
	// Enable compression for better performance
	EnableCompression: true,
}

func WebSocketHandler(hub *Hub, cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var tokenString string
		usingCookieToken := false

		// Try to get JWT from query parameter first (for WebSocket connections)
		if token := r.URL.Query().Get("token"); token != "" {
			tokenString = token
		} else {
			// Fallback to cookie
			cookie, err := r.Cookie("jwt_token")
			if err != nil {
				http.Error(w, "Missing token", http.StatusUnauthorized)
				return
			}
			tokenString = cookie.Value
			usingCookieToken = true
		}

		// Decoding the token and getting the User's informations
		claims, errTokenValidate := utils.ValidateToken(tokenString)
		if errTokenValidate != nil {
			http.Error(w, "Error decoding JWT", http.StatusUnauthorized)
			return
		}
		if claims.TokenType != "" && claims.TokenType != "websocket" {
			if !(usingCookieToken && claims.TokenType == "session") {
				http.Error(w, "Invalid token type", http.StatusUnauthorized)
				return
			}
		}

		// Extracting userID and username from claims struct
		userID := claims.UserID
		username := claims.Username

		// Upgrading the connection to WS
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("WebSocket upgrade error: %v", err)
			return
		}

		conn.SetCloseHandler(func(code int, text string) error {
			return nil
		})

		// Instantiating a new Client with the User's informations
		userGroups, err := db.DBService.GetUserGroups(int(userID))
		if err != nil {
			http.Error(w, "Error fetching user groups", http.StatusInternalServerError)
			return
		}

		// Instantiating a new Client struct with the User's information
		client := &Client{
			ID:       generateClientID(),
			UserID:   int(userID),
			Username: username,
			Conn:     conn,
			Hub:      hub,
			Send:     make(chan Message, 256),
			Groups:   make(map[string]*Group),
		}
		client.mu.Lock()
		client.lastHeartbeat = time.Now()
		client.mu.Unlock()

		// Register client first
		hub.register <- client

		// Join user to their groups
		for _, groupID := range userGroups {
			hub.JoinGroup(client, groupID)
		}

		go client.WritePump()
		go client.ReadPump()
	}
}

// generateClientID creates a unique client ID
func generateClientID() string {
	return time.Now().Format("20060102150405") + "-" +
		string(rune('A'+time.Now().Nanosecond()%26))
}
