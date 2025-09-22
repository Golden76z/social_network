package api

import (
	"encoding/json"
	"net/http"

	"github.com/Golden76z/social-network/db"
)

func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	// 1. Get token from cookie
	cookie, err := r.Cookie("jwt_token")
	if err != nil {
		if err == http.ErrNoCookie {
			http.Error(w, "No active session", http.StatusBadRequest)
			return
		}
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	// 2. DB operation (verification + deletion)
	err = db.DBService.VerifyAndDeleteSession(cookie.Value)
	if err != nil {
		switch err.Error() {
		case "session not found or expired":
			http.Error(w, "Invalid session", http.StatusUnauthorized)
		default:
			http.Error(w, "Logout failed", http.StatusInternalServerError)
		}
		return
	}

	// 3. Clear cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "jwt_token",
		Value:    "",
		HttpOnly: true,
		Secure:   false,                // Allow in development
		SameSite: http.SameSiteLaxMode, // Changed from StrictMode to LaxMode
		Path:     "/",
		MaxAge:   -1,
		Domain:   "localhost", // Set domain to localhost to work across ports
	})

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Logged out successfully"})
}
