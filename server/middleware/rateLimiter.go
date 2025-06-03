package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt"
)

func UserKeyFunc(r *http.Request) (string, error) {
	// Extract JWT from header (e.g., "Bearer <token>")
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return "", fmt.Errorf("missing authorization header")
	}
	tokenString := strings.TrimPrefix(authHeader, "Bearer ")

	// Parse JWT to get user ID
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
		return []byte("your-secret-key"), nil // Replace with your key
	})
	if err != nil {
		return "", fmt.Errorf("invalid token: %v", err)
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return "", fmt.Errorf("invalid token claims")
	}

	userID, ok := claims["user_id"].(string) // Assuming user_id is in JWT
	if !ok {
		return "", fmt.Errorf("user_id not found in token")
	}

	return userID, nil // Rate limit by user_id
}
