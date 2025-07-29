package middleware

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"time"

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
			// 1. Check session cookie
			token, err := r.Cookie("jwt_token")
			if err != nil {
				http.Error(w, "Unauthorized: Missing token", http.StatusUnauthorized)
				return
			}
			fmt.Println("Token found: ", token)

			// 2. Verify JWT validity
			utils.ValidateToken(token.Value)

			// 3. Verify session in database
			var userID int
			err = db.DBService.DB.QueryRow(`
                SELECT user_id FROM sessions 
                WHERE token = ? AND expires_at > ?`,
				token.Value,
				time.Now(),
			).Scan(&userID)

			// Add this line to see what the DB actually returns
			//fmt.Println("[AUTH] Database returned userID:", userID)

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
			ctx = context.WithValue(ctx, UserIDKey, userID)
			//ctx = context.WithValue(ctx, UsernameKey, username)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
