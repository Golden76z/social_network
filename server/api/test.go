package api

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/Golden76z/social-network/middleware"
)

// TestCookieHandler tests if cookies can be set properly
func TestCookieHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("TestCookieHandler: Setting test cookie\n")

	// Set a simple test cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "test_cookie",
		Value:    "test_value",
		HttpOnly: false, // Make it accessible to JavaScript for testing
		Secure:   false, // Allow in development
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
		MaxAge:   3600, // 1 hour
	})

	fmt.Printf("TestCookieHandler: Test cookie set\n")

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Test cookie set", "cookie": "test_cookie=test_value"}`))
}

// DebugCookieHandler helps debug cookie issues
func DebugCookieHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("DebugCookieHandler: Debugging cookies\n")

	// Get all cookies from the request
	cookies := r.Cookies()
	cookieMap := make(map[string]string)
	for _, cookie := range cookies {
		cookieMap[cookie.Name] = cookie.Value
	}

	// Check specifically for JWT token
	jwtCookie, err := r.Cookie("jwt_token")
	jwtInfo := map[string]interface{}{
		"found": false,
		"value": "",
		"error": "",
	}

	if err == nil {
		jwtInfo["found"] = true
		jwtInfo["value"] = jwtCookie.Value[:min(20, len(jwtCookie.Value))] + "..."
		jwtInfo["full_length"] = len(jwtCookie.Value)
	} else {
		jwtInfo["error"] = err.Error()
	}

	response := map[string]interface{}{
		"all_cookies": cookieMap,
		"jwt_token":   jwtInfo,
		"user_agent":  r.UserAgent(),
		"origin":      r.Header.Get("Origin"),
		"referer":     r.Header.Get("Referer"),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// TestAuthHandler tests authentication status
func TestAuthHandler(w http.ResponseWriter, r *http.Request) {
	// Check if JWT token exists
	cookie, err := r.Cookie("jwt_token")
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte(`{"authenticated": false, "error": "No JWT token found"}`))
		return
	}

	fmt.Printf("TestAuthHandler: JWT token found: %s...\n", cookie.Value[:20])

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"authenticated": true, "token": "` + cookie.Value[:20] + `..."}`))
}

// TestConversationsHandler tests the conversations endpoint with proper context handling
func TestConversationsHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("TestConversationsHandler: Handler called!\n")

	// Check if userID is in context
	userIDValue := r.Context().Value(middleware.UserIDKey)
	if userIDValue == nil {
		fmt.Printf("TestConversationsHandler: No user ID in context\n")
		http.Error(w, "User not authenticated", http.StatusUnauthorized)
		return
	}

	fmt.Printf("TestConversationsHandler: userIDValue type: %T, value: %v\n", userIDValue, userIDValue)
	userID, ok := userIDValue.(int64)
	if !ok {
		fmt.Printf("TestConversationsHandler: Type assertion failed, got type: %T\n", userIDValue)
		http.Error(w, "Invalid user ID in context", http.StatusInternalServerError)
		return
	}

	fmt.Printf("TestConversationsHandler: Success! User ID: %d\n", userID)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Test conversations handler working", "user_id": ` + fmt.Sprintf("%d", userID) + `}`))
}
