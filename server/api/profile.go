package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"github.com/Golden76z/social-network/db"
	"github.com/Golden76z/social-network/models"
	"strconv"

	//"github.com/Golden76z/social-network/config"
	"github.com/Golden76z/social-network/middleware"
	//"github.com/Golden76z/social-network/utils"
	"net/http"
)

// Define custom types for context keys to avoid collisions.
//type contextKey string

//const (
//	userIDKey contextKey = "user_id"
//)

// Handler to access User's Profile data
func GetUserProfileHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("[PROFILE] GetUserProfileHandler")

	// Only GET method allowed
	if r.Method != http.MethodGet {
		http.Error(w, "Only GET method allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get current user ID from context (injected by AuthMiddleware)
	currentUserID, ok := r.Context().Value(middleware.UserIDKey).(int)
	fmt.Println("[PROFILE] Current User ID:", currentUserID)

	if !ok {
		fmt.Println("[ERROR]:", "User ID not found in context")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Check if database connection is available
	if db.DBService.DB == nil {
		fmt.Println("[ERROR]: Database connection is nil")
		http.Error(w, "Database connection error", http.StatusInternalServerError)
		return
	}

	// Parse optional id query parameter
	idParam := r.URL.Query().Get("id")
	//fmt.Println("[USERID]:", currentUserID)
	var targetUserID int64
	var err error

	if idParam == "" {
		// No id parameter, return the current user's profile
		targetUserID = int64(currentUserID)
	} else {
		// Parse the id parameter
		targetUserID, err = strconv.ParseInt(idParam, 10, 64)
		if err != nil {
			http.Error(w, "Invalid user ID format", http.StatusBadRequest)
			return
		}
	}

	fmt.Printf("[PROFILE] Fetching profile for user ID: %d\n", targetUserID)

	// Fetch user profile from database
	profile, err := getUserProfileFromDB(targetUserID)
	if err != nil {
		fmt.Printf("[ERROR] Database error: %v\n", err)
		if err == sql.ErrNoRows {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Determine response based on privacy settings and requester
	var response models.UserProfileResponse
	isOwnProfile := targetUserID == int64(currentUserID)

	if isOwnProfile {
		// Own profile - return full information
		response = models.UserProfileResponse{
			ID:          profile.ID,
			Nickname:    profile.Nickname,
			FirstName:   profile.FirstName,
			LastName:    profile.LastName,
			Email:       profile.Email,
			DateOfBirth: profile.DateOfBirth,
			Avatar:      profile.GetAvatar(),
			Bio:         profile.GetBio(),
			IsPrivate:   profile.IsPrivate,
		}
	} else if profile.IsPrivate {
		// Private profile - return minimal information
		response = models.UserProfileResponse{
			ID:       profile.ID,
			Nickname: profile.Nickname,
			Avatar:   profile.GetAvatar(),
		}
	} else {
		// Public profile - return profile without sensitive data
		response = models.UserProfileResponse{
			ID:        profile.ID,
			Nickname:  profile.Nickname,
			FirstName: profile.FirstName,
			LastName:  profile.LastName,
			Avatar:    profile.GetAvatar(),
			Bio:       profile.GetBio(),
			IsPrivate: profile.IsPrivate,
		}
	}

	// Set response headers and send a JSON response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
	fmt.Println("[RESPONSE]:", response)

}

// Helper function to fetch user profile from database
func getUserProfileFromDB(userID int64) (*models.User, error) {
	var user models.User

	query := `
		SELECT id, nickname, first_name, last_name, email, date_of_birth, avatar, bio, is_private
		FROM users
		WHERE id = ?
	`

	fmt.Printf("[DB] Querying user with ID: %d\n", userID)

	err := db.DBService.DB.QueryRow(query, userID).Scan(
		&user.ID,
		&user.Nickname,
		&user.FirstName,
		&user.LastName,
		&user.Email,
		&user.DateOfBirth,
		&user.Avatar,
		&user.Bio,
		&user.IsPrivate,
	)

	if err != nil {
		fmt.Printf("[DB ERROR] Failed to query user: %v\n", err)
		return nil, err
	}

	fmt.Printf("[DB SUCCESS] Found user: %+v\n", user)
	return &user, nil
}

// Handler to take care of the profile modification
func UpdateUserProfileHandler(w http.ResponseWriter, r *http.Request) {

}
