// middleware/security_test.go
package middleware

import (
	"formbuilder-api/middleware"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestSecurityHeaders(t *testing.T) {
	req := httptest.NewRequest("GET", "/api/test", nil)
	rr := httptest.NewRecorder()

	handler := middleware.SecurityHeaders(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	}))

	handler.ServeHTTP(rr, req)

	// Test security headers
	headers := []string{
		"Strict-Transport-Security",
		"X-Content-Type-Options",
		"X-Frame-Options",
		"Content-Security-Policy",
	}

	for _, h := range headers {
		if rr.Header().Get(h) == "" {
			t.Errorf("Missing security header: %s", h)
		}
	}

	// Test CORS headers for API routes
	if rr.Header().Get("Access-Control-Allow-Origin") != "https://your-frontend.com" {
		t.Error("Missing CORS headers for API route")
	}
}

func TestNonAPIRoute(t *testing.T) {
	req := httptest.NewRequest("GET", "/static/asset.js", nil)
	rr := httptest.NewRecorder()

	handler := middleware.SecurityHeaders(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	}))

	handler.ServeHTTP(rr, req)

	if rr.Header().Get("Access-Control-Allow-Origin") != "" {
		t.Error("CORS headers should not be set for non-API routes")
	}
}
