package websockets

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/golang-jwt/jwt"
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

func Handler(hub *Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 1. Extract JWT token from cookie (or header)
		cookie, err := r.Cookie("jwt_token")
		if err != nil {
			http.Error(w, "Missing token", http.StatusUnauthorized)
			return
		}
		tokenString := cookie.Value

		// 2. Parse and validate the token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Validate signing method and return secret key
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(os.Getenv("JWT_SECRET")), nil // Replace with your secret
		})

		if err != nil || !token.Valid {
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		// 3. Extract claims (user ID and username)
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			http.Error(w, "Invalid token claims", http.StatusUnauthorized)
			return
		}

		userID, ok := claims["user_id"].(float64) // JSON numbers decode as float64
		if !ok {
			http.Error(w, "Missing user_id in token", http.StatusUnauthorized)
			return
		}

		username, ok := claims["username"].(string)
		if !ok {
			http.Error(w, "Missing username in token", http.StatusUnauthorized)
			return
		}

		// Proceed with WebSocket upgrade...
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("WebSocket upgrade error: %v", err)
			return
		}

		client := &Client{
			ID:       generateClientID(),
			UserID:   int(userID), // Convert float64 to int
			Username: username,
			Conn:     conn,
			Hub:      hub,
			Send:     make(chan Message, 256),
			Rooms:    make(map[string]bool),
		}

		hub.register <- client
		go client.WritePump()
		go client.ReadPump()
	}
}

// generateClientID creates a unique client ID
func generateClientID() string {
	return time.Now().Format("20060102150405") + "-" +
		string(rune('A'+time.Now().Nanosecond()%26))
}
