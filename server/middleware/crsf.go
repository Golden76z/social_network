// middleware/csrf.go
package middleware

import (
	"net/http"
	"os"

	"github.com/google/uuid"
)

func CSRFMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Skip for GET/HEAD/OPTIONS
		if r.Method == "GET" || r.Method == "HEAD" || r.Method == "OPTIONS" {
			// Generate and set CSRF token for GET requests
			token := uuid.New().String()
			http.SetCookie(w, &http.Cookie{
				Name:     "csrf_token",
				Value:    token,
				Path:     "/",
				Secure:   os.Getenv("ENV") == "production",
				HttpOnly: false,
				SameSite: http.SameSiteStrictMode,
			})
			next.ServeHTTP(w, r)
			return
		}

		// Verify token for other methods
		csrfToken := r.Header.Get("X-CSRF-Token")
		cookieToken, err := r.Cookie("csrf_token")

		if err != nil || csrfToken == "" || csrfToken != cookieToken.Value {
			http.Error(w, "Invalid CSRF token", http.StatusForbidden)
			return
		}

		// Rotate token after use
		newToken := uuid.New().String()
		http.SetCookie(w, &http.Cookie{
			Name:     "csrf_token",
			Value:    newToken,
			Path:     "/",
			Secure:   os.Getenv("ENV") == "production",
			HttpOnly: false,
			SameSite: http.SameSiteStrictMode,
		})

		next.ServeHTTP(w, r)
	})
}
