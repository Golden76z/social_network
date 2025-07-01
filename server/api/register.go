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

	// Double check if one of the register field is empty
	if req.Nickname == "" || req.FirstName == "" || req.LastName == "" ||
		req.Email == "" || req.Password == "" || req.DateOfBirth == "" {
		http.Error(w, "All fields are required", http.StatusBadRequest)
		return
	}

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
