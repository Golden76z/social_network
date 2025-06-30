package middleware

import (
	"context"
	"database/sql"
	"net/http"
	"time"

	"github.com/Golden76z/social-network/utils"
)

// Define custom types for context keys to avoid collisions.
type contextKey string

const (
	userIDKey   contextKey = "user_id"
	usernameKey contextKey = "username"
)

// AuthMiddleware validates the session and attaches userID + username to the context.
func AuthMiddleware(db *sql.DB) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// 1. Check session cookie
			token, err := r.Cookie("jwt_token")
			if err != nil {
				http.Error(w, "Unauthorized: Missing token", http.StatusUnauthorized)
				return
			}
			// 2. Verify JWT validity
			utils.ValidateToken(token.Value, utils.Settings.JwtKey)

			// 3. Verify session in database
			var (
				userID    int
				username  string
				expiresAt time.Time
			)
			err = db.QueryRow(`
				SELECT s.user_id, u.username, s.expires_at 
				FROM sessions s
				JOIN users u ON s.user_id = u.id
				WHERE s.token = ? AND s.expires_at > ?`,
				token.Value, time.Now(),
			).Scan(&userID, &username, &expiresAt)

			if err != nil {
				if err == sql.ErrNoRows {
					http.Error(w, "Unauthorized: Invalid session", http.StatusUnauthorized)
				} else {
					http.Error(w, "Database error", http.StatusInternalServerError)
				}
				return
			}

			// 4. Attach user data to context using custom keys
			ctx := r.Context()
			ctx = context.WithValue(ctx, userIDKey, userID)
			ctx = context.WithValue(ctx, usernameKey, username)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
