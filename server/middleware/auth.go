package middleware

import (
	"context"
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
			// 1. Extract user ID and username from JWT token (from cookie or Authorization header)
			claims, err := utils.GetUserFromJWT(r)
			if err != nil {
				http.Error(w, "Invalid token", http.StatusUnauthorized)
				return
			}

			userID := claims.UserID
			username := claims.Username

			if userID == 0 {
				http.Error(w, "Invalid token", http.StatusUnauthorized)
				return
			}

			// 4. Optionally verify session exists (but don't fail if it doesn't)
			// Get token string for session verification
			var tokenString string
			authHeader := r.Header.Get("Authorization")
			if authHeader != "" && len(authHeader) > 7 && authHeader[:7] == "Bearer " {
				tokenString = authHeader[7:]
			} else {
				if cookie, err := r.Cookie("jwt_token"); err == nil {
					tokenString = cookie.Value
				}
			}

			if tokenString != "" {
				var sessionExists bool
				err = db.DBService.DB.QueryRow(`
	                SELECT EXISTS(SELECT 1 FROM sessions 
	                WHERE token = ? AND expires_at > ?)`,
					tokenString,
					time.Now(),
				).Scan(&sessionExists)

				// If session doesn't exist, create one (but don't fail if this fails)
				if err == nil && !sessionExists {
					_ = db.DBService.CreateSession(userID, tokenString, config.GetConfig().JwtExpiration)
				}
			}

			// 5. Attach user data to context using custom keys
			ctx := r.Context()
			ctx = context.WithValue(ctx, UserIDKey, userID)
			ctx = context.WithValue(ctx, UsernameKey, username)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
