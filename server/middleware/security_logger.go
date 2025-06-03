package middleware

import (
	"log"
	"net/http"
)

// middleware/security_logger.go
func SecurityLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get real IP after all middleware processing
		ip := r.RemoteAddr
		if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
			ip = forwarded + " -> " + ip
		}

		// Log security-relevant information
		log.Printf("SECURITY: ip=%s method=%s path=%s ua=%s cf-ray=%s",
			ip,
			r.Method,
			r.URL.Path,
			r.UserAgent(),
			r.Header.Get("CF-Ray"),
		)

		next.ServeHTTP(w, r)
	})
}
