package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"github.com/Golden76z/social-network/db"
	"github.com/Golden76z/social-network/models"
	"github.com/Golden76z/social-network/utils"
	"strconv"

	"github.com/Golden76z/social-network/middleware"
	"net/http"
)

// Handler to access User's Profile data
func GetUserProfileHandler(w http.ResponseWriter, r *http.Request) {
	// Only GET method allowed
	if r.Method != http.MethodGet {
		http.Error(w, "Only GET method allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get current user ID from context (injected by AuthMiddleware)
	currentUserID, ok := r.Context().Value(middleware.UserIDKey).(int)

	fmt.Printf("[INFO] Current user ID: %d\n", currentUserID)

	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Check if database connection is available
	if db.DBService.DB == nil {
		http.Error(w, "Database connection error", http.StatusInternalServerError)
		return
	}

	// Parse optional id query parameter
	idParam := r.URL.Query().Get("id")
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
			ID:        profile.ID,
			Nickname:  profile.Nickname,
			Avatar:    profile.GetAvatar(),
			IsPrivate: profile.IsPrivate,
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
}

// Helper function to fetch user profile from database
func getUserProfileFromDB(userID int64) (*models.User, error) {
	var user models.User

	query := `
		SELECT id, nickname, first_name, last_name, email, date_of_birth, avatar, bio, is_private
		FROM users
		WHERE id = ?
	`

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
		return nil, err
	}

	return &user, nil
}

// Handler to update user profile information
func UpdateUserProfileHandler(w http.ResponseWriter, r *http.Request) {
	// Only PUT/PATCH methods allowed
	if r.Method != http.MethodPut && r.Method != http.MethodPatch {
		http.Error(w, "Only PUT/PATCH methods allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get current user ID from context (injected by AuthMiddleware)
	currentUserID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Check if database connection is available
	if db.DBService.DB == nil {
		http.Error(w, "Database connection error", http.StatusInternalServerError)
		return
	}

	// Parse JSON request body
	var updateRequest models.UpdateUserProfileRequest
	err := json.NewDecoder(r.Body).Decode(&updateRequest)
	if err != nil {
		http.Error(w, "Invalid JSON format", http.StatusBadRequest)
		return
	}

	// Validate and sanitize input fields
	if err := validateUpdateRequest(&updateRequest); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Build dynamic update query
	updateFields := buildUpdateFields(&updateRequest)
	if len(updateFields) == 0 {
		http.Error(w, "No fields to update", http.StatusBadRequest)
		return
	}

	// Check for unique constraints (nickname, email)
	if err := checkUniqueConstraints(&updateRequest, int64(currentUserID)); err != nil {
		http.Error(w, err.Error(), http.StatusConflict)
		return
	}

	// Execute update in transaction
	tx, err := db.DBService.DB.Begin()
	if err != nil {
		http.Error(w, "Database transaction error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Build and execute update query
	query, values := utils.BuildUpdateQuery("users", updateFields, "id = ?")
	values = append(values, currentUserID)

	_, err = tx.Exec(query, values...)
	if err != nil {
		fmt.Printf("[ERROR] Update failed: %v\n", err)
		http.Error(w, "Failed to update profile", http.StatusInternalServerError)
		return
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		http.Error(w, "Failed to commit update", http.StatusInternalServerError)
		return
	}

	// Build updated fields map for response
	updatedFields := make(map[string]interface{})
	if updateRequest.FirstName != nil {
		updatedFields["firstName"] = *updateRequest.FirstName
	}
	if updateRequest.LastName != nil {
		updatedFields["lastName"] = *updateRequest.LastName
	}
	if updateRequest.Nickname != nil {
		updatedFields["nickname"] = *updateRequest.Nickname
	}
	if updateRequest.Email != nil {
		updatedFields["email"] = *updateRequest.Email
	}
	if updateRequest.DateOfBirth != nil {
		updatedFields["dateOfBirth"] = *updateRequest.DateOfBirth
	}
	if updateRequest.Avatar != nil {
		updatedFields["avatar"] = *updateRequest.Avatar
	}
	if updateRequest.Bio != nil {
		updatedFields["bio"] = *updateRequest.Bio
	}
	if updateRequest.IsPrivate != nil {
		updatedFields["isPrivate"] = *updateRequest.IsPrivate
	}

	response := models.UpdateProfileResponse{
		Message:       "Profile updated successfully",
		UpdatedFields: updatedFields,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// validateUpdateRequest validates and sanitizes input fields
func validateUpdateRequest(req *models.UpdateUserProfileRequest) error {
	if req.Nickname != nil {
		*req.Nickname = utils.SanitizeString(*req.Nickname)
		if !utils.ValidateNickname(*req.Nickname) {
			return fmt.Errorf("invalid nickname format")
		}
	}

	if req.FirstName != nil {
		*req.FirstName = utils.SanitizeString(*req.FirstName)
		if !utils.ValidateName(*req.FirstName) {
			return fmt.Errorf("invalid first name format")
		}
	}

	if req.LastName != nil {
		*req.LastName = utils.SanitizeString(*req.LastName)
		if !utils.ValidateName(*req.LastName) {
			return fmt.Errorf("invalid last name format")
		}
	}

	if req.Email != nil {
		*req.Email = utils.SanitizeString(*req.Email)
		if !utils.ValidateEmail(*req.Email) {
			return fmt.Errorf("invalid email format")
		}
	}

	if req.DateOfBirth != nil {
		*req.DateOfBirth = utils.SanitizeString(*req.DateOfBirth)
		if !utils.ValidateDateOfBirth(*req.DateOfBirth) {
			return fmt.Errorf("invalid date of birth format")
		}
	}

	if req.Bio != nil {
		*req.Bio = utils.SanitizeString(*req.Bio)
		if !utils.ValidateBio(*req.Bio) {
			return fmt.Errorf("bio too long (max 500 characters)")
		}
	}

	if req.Avatar != nil {
		*req.Avatar = utils.SanitizeString(*req.Avatar)
	}

	return nil
}

// buildUpdateFields creates UpdateField slice from request
func buildUpdateFields(req *models.UpdateUserProfileRequest) []utils.UpdateField {
	var fields []utils.UpdateField

	if req.Nickname != nil {
		fields = append(fields, utils.UpdateField{Column: "nickname", Value: *req.Nickname})
	}
	if req.FirstName != nil {
		fields = append(fields, utils.UpdateField{Column: "first_name", Value: *req.FirstName})
	}
	if req.LastName != nil {
		fields = append(fields, utils.UpdateField{Column: "last_name", Value: *req.LastName})
	}
	if req.Email != nil {
		fields = append(fields, utils.UpdateField{Column: "email", Value: *req.Email})
	}
	if req.DateOfBirth != nil {
		fields = append(fields, utils.UpdateField{Column: "date_of_birth", Value: *req.DateOfBirth})
	}
	if req.Avatar != nil {
		fields = append(fields, utils.UpdateField{Column: "avatar", Value: utils.ConvertToNullString(req.Avatar)})
	}
	if req.Bio != nil {
		fields = append(fields, utils.UpdateField{Column: "bio", Value: utils.ConvertToNullString(req.Bio)})
	}
	if req.IsPrivate != nil {
		fields = append(fields, utils.UpdateField{Column: "is_private", Value: *req.IsPrivate})
	}

	return fields
}

// checkUniqueConstraints verifies nickname and email uniqueness
func checkUniqueConstraints(req *models.UpdateUserProfileRequest, userID int64) error {
	if req.Nickname != nil {
		var existingID int64
		err := db.DBService.DB.QueryRow("SELECT id FROM users WHERE nickname = ? AND id != ?", *req.Nickname, userID).Scan(&existingID)
		if err == nil {
			return fmt.Errorf("nickname already exists")
		} else if err != sql.ErrNoRows {
			return fmt.Errorf("database error checking nickname")
		}
	}

	if req.Email != nil {
		var existingID int64
		err := db.DBService.DB.QueryRow("SELECT id FROM users WHERE email = ? AND id != ?", *req.Email, userID).Scan(&existingID)
		if err == nil {
			return fmt.Errorf("email already exists")
		} else if err != sql.ErrNoRows {
			return fmt.Errorf("database error checking email")
		}
	}

	return nil
}
