package api

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/Golden76z/social-network/utils"
)

// GetWebSocketTokenHandler issues a short-lived token for websocket authentication
func GetWebSocketTokenHandler(w http.ResponseWriter, r *http.Request) {
	claims, err := utils.GetUserFromJWT(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	const wsTokenTTL = 10 * time.Minute // Increased from 5 minutes to 10 minutes for better stability
	token, err := utils.GenerateWebSocketToken(claims.UserID, claims.Username, wsTokenTTL)
	if err != nil {
		http.Error(w, "Failed to generate websocket token", http.StatusInternalServerError)
		return
	}

	response := map[string]any{
		"token":      token,
		"expires_at": time.Now().Add(wsTokenTTL).UTC(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
