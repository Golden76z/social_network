package websockets

import (
	"fmt"
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
			log.Printf("WebSocket: Using token from query parameter")
		} else {
			// Fallback to cookie
			cookie, err := r.Cookie("jwt_token")
			if err != nil {
				log.Printf("WebSocket: Missing token in both query parameter and cookie")
				http.Error(w, "Missing token", http.StatusUnauthorized)
				return
			}
			tokenString = cookie.Value
			log.Printf("WebSocket: Using token from cookie")
			usingCookieToken = true
		}

		// Decoding the token and getting the User's informations
		tokenPreview := tokenString
		if len(tokenString) > 20 {
			tokenPreview = tokenString[:20]
		}
		log.Printf("WebSocket: Validating token: %s...", tokenPreview)
		claims, errTokenValidate := utils.ValidateToken(tokenString)
		if errTokenValidate != nil {
			log.Printf("WebSocket: Token validation failed: %v", errTokenValidate)
			http.Error(w, "Error decoding JWT", http.StatusUnauthorized)
			return
		}
		if claims.TokenType != "" && claims.TokenType != "websocket" {
			if usingCookieToken && claims.TokenType == "session" {
				log.Printf("WebSocket: Using session token from cookie for user %s", claims.Username)
			} else {
				log.Printf("WebSocket: Token type %s not permitted", claims.TokenType)
				http.Error(w, "Invalid token type", http.StatusUnauthorized)
				return
			}
		}
		log.Printf("WebSocket: Token validated successfully for user: %s", claims.Username)

		// Extracting userID and username from claims struct
		userID := claims.UserID
		username := claims.Username

		fmt.Println("[handler/userID]", userID, " [handler/username]", username)

		// Upgrading the connection to WS
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("WebSocket upgrade error: %v", err)
			return
		}

		conn.SetCloseHandler(func(code int, text string) error {
			log.Printf("WebSocket close frame for user %d: code=%d reason=%s", userID, code, text)
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
		log.Printf("🔌 Registering client %s for user %d (%s)", client.ID, client.UserID, client.Username)
		hub.register <- client

		// Join user to their groups
		for _, groupID := range userGroups {
			if err := hub.JoinGroup(client, groupID); err != nil {
				log.Printf("Error joining group %s: %v", groupID, err)
			}
		}

		log.Printf("🔌 Starting WritePump and ReadPump for client %s (user %d)", client.ID, client.UserID)
		go client.WritePump()
		go client.ReadPump()
		log.Printf("🔌 WritePump and ReadPump started for client %s (user %d)", client.ID, client.UserID)
	}
}

// generateClientID creates a unique client ID
func generateClientID() string {
	return time.Now().Format("20060102150405") + "-" +
		string(rune('A'+time.Now().Nanosecond()%26))
}
