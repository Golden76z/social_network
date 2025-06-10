package middleware

import (
	"database/sql"
	"net/http"
	"time"
)

// AuthMiddleware checks for valid session
func AuthMiddleware(db *sql.DB) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			cookie, err := r.Cookie("session_token")
			if err != nil {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			// Verify session in database
			var userID int
			var expiresAt time.Time
			err = db.QueryRow(`
				SELECT user_id, expires_at 
				FROM sessions 
				WHERE token = ? AND expires_at > ?`,
				cookie.Value, time.Now()).Scan(&userID, &expiresAt)

			if err != nil {
				if err == sql.ErrNoRows {
					http.Error(w, "Unauthorized", http.StatusUnauthorized)
				} else {
					http.Error(w, "Internal Server Error", http.StatusInternalServerError)
				}
				return
			}

			// Add user ID to request context
			ctx := r.Context()
			ctx = setUserID(ctx, userID)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
