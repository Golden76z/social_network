package websockets

import (
	"log"
	"net/http"
	"os"
	"slices"
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
		}

		// For development, allow localhost connections
		env := os.Getenv("ENV")
		if env == "DEV" && (origin == "http://localhost:3000" || origin == "http://localhost:3030") {
			return true
		}

		// Check against allowed origins in production
		return slices.Contains(allowedOrigins, origin)
	},
	// Enable compression for better performance
	EnableCompression: true,
}

func WebSocketHandler(hub *Hub, cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Extracting JWT from cookie
		cookie, err := r.Cookie("jwt_token")
		if err != nil {
			http.Error(w, "Missing token", http.StatusUnauthorized)
			return
		}
		tokenString := cookie.Value

		// Decoding the token and getting the User's informations
		claims, errTokenValidate := utils.ValidateToken(tokenString, cfg.JWTKey)
		if errTokenValidate != nil {
			http.Error(w, "Error decoding JWT", http.StatusUnauthorized)
			return
		}

		// Extracting userID
		userID, ok := claims["user_id"].(float64)
		if !ok {
			http.Error(w, "Missing user_id in token", http.StatusUnauthorized)
			return
		}

		// Extracting username
		username, ok := claims["username"].(string)
		if !ok {
			http.Error(w, "Missing username in token", http.StatusUnauthorized)
			return
		}

		// Upgrading the connection to WS
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("WebSocket upgrade error: %v", err)
			return
		}

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

		// Register client first
		hub.register <- client

		// Join user to their groups
		for _, groupID := range userGroups {
			if err := hub.JoinGroup(client, groupID); err != nil {
				log.Printf("Error joining group %s: %v", groupID, err)
			}
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
