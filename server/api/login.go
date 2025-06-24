package api

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/Golden76z/social-network/db"
	"github.com/Golden76z/social-network/models"
)

// Handler that will communicate with the database to check wether the credentials are correct or not
func LoginHandler(DB *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
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

		err := db.DBService.LoginDB(req.Username, req.Password, w)
		if err != nil {
			// fmt.Println("Error checking credentials with the database", err)
			return
		}
	}
}
