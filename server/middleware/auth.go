package middleware

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/Golden76z/social-network/config"
	"github.com/Golden76z/social-network/db"
	"github.com/Golden76z/social-network/utils"
)

// Define custom types for context keys to avoid collisions.
type contextKey string

const (
	UserIDKey   contextKey = "user_id"
	UsernameKey contextKey = "username"
)

// AuthMiddleware validates the session and attaches userID + username to the context.
func AuthMiddleware() func(http.Handler) http.Handler {
	//fmt.Println("[AuthMiddleware]")
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			fmt.Printf("AuthMiddleware: Processing request %s %s\n", r.Method, r.URL.Path)

			// 1. Check session cookie
			token, err := r.Cookie("jwt_token")
			if err != nil {
				fmt.Printf("AuthMiddleware: No JWT token cookie found: %v\n", err)
				http.Error(w, "Unauthorized: Missing token", http.StatusUnauthorized)
				return
			}

			fmt.Printf("AuthMiddleware: JWT token found: %s...\n", token.Value[:20])

			// 2. Verify JWT validity
			_, err = utils.ValidateToken(token.Value)
			if err != nil {
				fmt.Printf("AuthMiddleware: JWT validation failed: %v\n", err)
				http.Error(w, "Invalid token", http.StatusUnauthorized)
				return
			}

			// 3. Extract user ID from JWT token (more reliable than session lookup)
			userID, err := utils.GetUserIDFromTokenString(token.Value)
			if err != nil || userID == 0 {
				fmt.Printf("AuthMiddleware: Failed to extract user ID: %v, userID: %d\n", err, userID)
				http.Error(w, "Invalid token", http.StatusUnauthorized)
				return
			}

			fmt.Printf("AuthMiddleware: User ID extracted: %d\n", userID)

			// 4. Optionally verify session exists (but don't fail if it doesn't)
			var sessionExists bool
			err = db.DBService.DB.QueryRow(`
                SELECT EXISTS(SELECT 1 FROM sessions 
                WHERE token = ? AND expires_at > ?)`,
				token.Value,
				time.Now(),
			).Scan(&sessionExists)

			// If session doesn't exist, create one (but don't fail if this fails)
			if err == nil && !sessionExists {
				_ = db.DBService.CreateSession(userID, token.Value, config.GetConfig().JwtExpiration)
			}

			// 5. Attach user data to context using custom keys
			ctx := r.Context()
			ctx = context.WithValue(ctx, UserIDKey, userID)
			//ctx = context.WithValue(ctx, UsernameKey, username)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
