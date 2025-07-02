package middleware

import (
	"context"
	"database/sql"
	"net/http"
	"time"

	"github.com/Golden76z/social-network/db"
	"github.com/Golden76z/social-network/utils"
)

// Define custom types for context keys to avoid collisions.
type contextKey string

const (
	userIDKey   contextKey = "user_id"
	usernameKey contextKey = "username"
)

// AuthMiddleware validates the session and attaches userID + username to the context.
func AuthMiddleware() func(http.Handler) http.Handler {
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
			var userID int
			err = db.DBService.DB.QueryRow(`
                SELECT user_id FROM sessions 
                WHERE token = ? AND expires_at > ?`,
				token.Value,
				time.Now(),
			).Scan(&userID)

			if err != nil {
				if err == sql.ErrNoRows {
					http.Error(w, "Invalid session", http.StatusUnauthorized)
				} else {
					http.Error(w, "Database error", http.StatusInternalServerError)
				}
				return
			}

			// 4. Attach user data to context using custom keys
			ctx := r.Context()
			ctx = context.WithValue(ctx, userIDKey, userID)
			// ctx = context.WithValue(ctx, usernameKey, username)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
