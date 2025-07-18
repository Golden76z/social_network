package api

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/Golden76z/social-network/db"
	"github.com/Golden76z/social-network/models"
	"github.com/Golden76z/social-network/utils"
)

// Handler that will communicate with the database to check wether the credentials are correct or not
func LoginHandler(w http.ResponseWriter, r *http.Request) {
	// Checking the method used - Cancel everything that is not POST
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}

	// Storing the client data (json) into a go struct
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Double checking if the client side returned empty fields
	if req.Username == "" || req.Password == "" {
		http.Error(w, "Username and password are required", http.StatusBadRequest)
		return
	}

	// Sanitize username input (not password as it might need special characters)
	req.Username = utils.SanitizeString(req.Username)

	// Validate username format - it can be either email or nickname
	if !isValidUsername(req.Username) {
		http.Error(w, "Invalid username format. Please use a valid email or nickname (3-20 characters, letters, numbers, underscores, hyphens)", http.StatusBadRequest)
		return
	}

	// Basic password validation (just check it's not empty after potential sanitization issues)
	if strings.TrimSpace(req.Password) == "" {
		http.Error(w, "Password cannot be empty", http.StatusBadRequest)
		return
	}

	err := db.DBService.LoginDB(req.Username, req.Password, w)
	if err != nil {
		// fmt.Println("Error checking credentials with the database", err)
		return
	}

	// Creating a session for the user
	errSession := utils.CookieSession(req.Username, w)
	if errSession != nil {
		http.Error(w, "Error creating session with cookies", http.StatusBadRequest)
		return
	}

	// Send back a response to the client-side in case of success
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Login successful"}`))
}

// Helper function to validate username (can be email or nickname)
func isValidUsername(username string) bool {
	// Check if it's a valid email format
	if strings.Contains(username, "@") {
		return utils.ValidateEmail(username)
	}

	// Otherwise, validate as nickname
	return utils.ValidateNickname(username)
}
