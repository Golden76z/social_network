package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

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
	fmt.Printf("Creating session for user: %s\n", req.Username)

	// Generate JWT token
	token, err := utils.JWTGeneration(req.Username, w)
	if err != nil {
		fmt.Printf("Error generating JWT: %v\n", err)
		http.Error(w, "Error generating JWT token", http.StatusInternalServerError)
		return
	}

	// Get user_id for session creation
	userID, err := db.DBService.GetUserIDByUsername(req.Username)
	if err != nil {
		fmt.Printf("Error getting user ID: %v\n", err)
		http.Error(w, "Error getting user ID", http.StatusInternalServerError)
		return
	}

	// Store session in database
	// We need to access config through the utils package
	err = db.DBService.CreateSession(int(userID), token, time.Hour*4) // Use default 4 hours for now
	if err != nil {
		fmt.Printf("Error creating session in DB: %v\n", err)
		http.Error(w, "Error creating session in database", http.StatusInternalServerError)
		return
	}

	// Set cookie manually
	secure := false // Development mode
	sameSite := http.SameSiteLaxMode

	cookie := &http.Cookie{
		Name:     "jwt_token",
		Value:    token,
		HttpOnly: true,
		Secure:   secure,
		SameSite: sameSite,
		Path:     "/",
		MaxAge:   int(time.Hour * 4), // 4 hours
		Domain:   "localhost",        // Set domain to localhost to work across ports
	}

	http.SetCookie(w, cookie)
	fmt.Printf("Session created successfully for user: %s\n", req.Username)

	// Send back a response with the token for localStorage
	response := map[string]interface{}{
		"message": "Login successful",
		"token":   token,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
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
