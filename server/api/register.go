package api

import (
	"encoding/json"
	"net/http"

	"github.com/Golden76z/social-network/db"
	"github.com/Golden76z/social-network/models"
	"github.com/Golden76z/social-network/utils"
)

// Handler that will communicate with the database to create a new user
func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	// Checking the type of request - Only POST requests allowed
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}

	// Converting the JSON sent by client-side to struct
	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Basic empty field check
	if req.Nickname == "" || req.FirstName == "" || req.LastName == "" ||
		req.Email == "" || req.Password == "" || req.DateOfBirth == "" {
		http.Error(w, "All fields are required", http.StatusBadRequest)
		return
	}

	// Sanitize all input fields
	req.Nickname = utils.SanitizeString(req.Nickname)
	req.FirstName = utils.SanitizeString(req.FirstName)
	req.LastName = utils.SanitizeString(req.LastName)
	req.Email = utils.SanitizeString(req.Email)
	req.DateOfBirth = utils.SanitizeString(req.DateOfBirth)
	// Note: Password is not sanitized as it might need special characters

	// Validate email format
	if !utils.ValidateEmail(req.Email) {
		http.Error(w, "Invalid email format", http.StatusBadRequest)
		return
	}

	// Validate nickname
	if !utils.ValidateNickname(req.Nickname) {
		http.Error(w, "Nickname must be 3-20 characters long and contain only letters, numbers, underscores, and hyphens", http.StatusBadRequest)
		return
	}

	// Validate first name
	if !utils.ValidateName(req.FirstName) {
		http.Error(w, "First name must be 1-50 characters long and contain only letters, spaces, hyphens, and apostrophes", http.StatusBadRequest)
		return
	}

	// Validate last name
	if !utils.ValidateName(req.LastName) {
		http.Error(w, "Last name must be 1-50 characters long and contain only letters, spaces, hyphens, and apostrophes", http.StatusBadRequest)
		return
	}

	// Validate date of birth
	if !utils.ValidateDateOfBirth(req.DateOfBirth) {
		http.Error(w, "Invalid date of birth format (YYYY-MM-DD) or unrealistic date", http.StatusBadRequest)
		return
	}

	// Validate password (handles both plaintext and hashed passwords)
	if !utils.ValidatePassword(req.Password) {
		http.Error(w, utils.GetPasswordValidationMessage(), http.StatusBadRequest)
		return
	}

	// Validate bio if present (assuming bio is an optional field in RegisterRequest)
	// If bio field doesn't exist in RegisterRequest, remove this validation
	//if req.Bio != "" {
	//	req.Bio = utils.SanitizeString(req.Bio)
	//	if !utils.ValidateBio(req.Bio) {
	//		http.Error(w, "Bio must be 500 characters or less", http.StatusBadRequest)
	//		return
	//	}
	//}

	// Registering the user into the database
	err := db.DBService.RegisterDB(
		req.Nickname, req.FirstName, req.LastName,
		req.Email, req.Password, req.DateOfBirth,
		w,
	)
	// Checking if the insertion was successful or not
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	// Creating a session for the user
	errSession := utils.CookieSession(req.Nickname, w)
	if errSession != nil {
		http.Error(w, "Error creating session with cookies", http.StatusBadRequest)
		return
	}

	// Send back a response to the client-side in case of success
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"message": "Registration successful"}`))
}
