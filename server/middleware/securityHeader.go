// middleware/security.go
package middleware

import (
	"net/http"
	"os"
)

func SecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		headers := w.Header()

		// Basic security headers
		headers.Set("X-Content-Type-Options", "nosniff")
		headers.Set("X-Frame-Options", "DENY")
		headers.Set("X-XSS-Protection", "1; mode=block")
		headers.Set("Referrer-Policy", "strict-origin-when-cross-origin")

		// CSP - adjust based on your needs
		csp := "default-src 'self'; script-src 'self' 'unsafe-inline' cdn.example.com; style-src 'self' 'unsafe-inline'"
		headers.Set("Content-Security-Policy", csp)

		// HSTS - only in production
		if os.Getenv("ENV") == "production" {
			headers.Set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
		}

		next.ServeHTTP(w, r)
	})
}
