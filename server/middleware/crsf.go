package middleware

import (
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"sync"
	"time"
)

// CSRF protection
var csrfTokens = struct {
	sync.RWMutex
	tokens map[string]time.Time
}{tokens: make(map[string]time.Time)}

func generateCSRFToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(bytes), nil
}

func CSRFMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" || r.Method == "HEAD" || r.Method == "OPTIONS" {
			// Generate and set CSRF token for safe methods
			token, err := generateCSRFToken()
			if err != nil {
				http.Error(w, "Internal Server Error", http.StatusInternalServerError)
				return
			}

			csrfTokens.Lock()
			csrfTokens.tokens[token] = time.Now().Add(1 * time.Hour)
			csrfTokens.Unlock()

			w.Header().Set("X-CSRF-Token", token)
			next.ServeHTTP(w, r)
			return
		}

		// Verify CSRF token for unsafe methods
		token := r.Header.Get("X-CSRF-Token")
		if token == "" {
			http.Error(w, "CSRF token required", http.StatusForbidden)
			return
		}

		csrfTokens.RLock()
		expiry, exists := csrfTokens.tokens[token]
		csrfTokens.RUnlock()

		if !exists || time.Now().After(expiry) {
			http.Error(w, "Invalid CSRF token", http.StatusForbidden)
			return
		}

		next.ServeHTTP(w, r)
	})
}
