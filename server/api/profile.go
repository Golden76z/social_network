package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/Golden76z/social-network/db"
	"github.com/Golden76z/social-network/models"
	"github.com/Golden76z/social-network/utils"

	"net/http"

	"github.com/Golden76z/social-network/middleware"
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
		fmt.Printf("[DB] Database error: %v\n", err)
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

	// Check if current user is following the target user (only for other users' profiles)
	var isFollowing *bool
	var followStatus *string
	if !isOwnProfile {
		following, err := db.DBService.IsFollowing(int64(currentUserID), targetUserID)
		if err == nil {
			isFollowing = &following
		}

		// For private profiles, also get the follow request status
		if profile.IsPrivate {
			status, err := db.DBService.GetFollowRequestStatus(int64(currentUserID), targetUserID)
			if err == nil {
				followStatus = &status
			}
		}
	}

	if isOwnProfile {
		// Own profile - return full information (isFollowing is nil)
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
			CreatedAt:   profile.CreatedAt,
			Followers:   profile.Followers,
			Followed:    profile.Followed,
			IsFollowing: nil, // Always nil for own profile
		}
	} else if profile.IsPrivate {
		// Private profile - check if current user can see the profile
		canSeeProfile := false
		isMutualFriends := false

		if isFollowing != nil && *isFollowing {
			canSeeProfile = true
		}

		// Check if they are mutual friends
		mutualFriends, err := db.DBService.AreMutualFriends(int64(currentUserID), targetUserID)
		if err == nil {
			isMutualFriends = mutualFriends
			// If they are mutual friends, also can see profile
			if isMutualFriends {
				canSeeProfile = true
			}
		}

		if canSeeProfile {
			// User is following or are mutual friends, return full profile information
			response = models.UserProfileResponse{
				ID:           profile.ID,
				Nickname:     profile.Nickname,
				FirstName:    profile.FirstName,
				LastName:     profile.LastName,
				Email:        profile.Email, // Include email for private profiles as well
				Avatar:       profile.GetAvatar(),
				Bio:          profile.GetBio(),
				IsPrivate:    profile.IsPrivate,
				CreatedAt:    profile.CreatedAt,
				Followers:    profile.Followers,
				Followed:     profile.Followed,
				IsFollowing:  isFollowing,
				FollowStatus: followStatus,
			}
		} else {
			// User is not following and not mutual friends, return minimal information
			response = models.UserProfileResponse{
				ID:           profile.ID,
				Nickname:     profile.Nickname,
				Avatar:       profile.GetAvatar(),
				IsPrivate:    profile.IsPrivate,
				CreatedAt:    profile.CreatedAt,
				Followers:    profile.Followers,
				Followed:     profile.Followed,
				IsFollowing:  isFollowing,
				FollowStatus: followStatus,
			}
		}
	} else {
		// Public profile - include all information similar to own profile
		response = models.UserProfileResponse{
			ID:          profile.ID,
			Nickname:    profile.Nickname,
			FirstName:   profile.FirstName,
			LastName:    profile.LastName,
			Email:       profile.Email, // Include email for public profiles like own profile
			Avatar:      profile.GetAvatar(),
			Bio:         profile.GetBio(),
			IsPrivate:   profile.IsPrivate,
			CreatedAt:   profile.CreatedAt,
			Followers:   profile.Followers,
			Followed:    profile.Followed,
			IsFollowing: isFollowing,
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
		SELECT id, nickname, first_name, last_name, email, date_of_birth, avatar, bio, is_private, created_at
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
		&user.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	// Calculate follower count dynamically from follow_requests table
	followerCountQuery := `
		SELECT COUNT(*) 
		FROM follow_requests 
		WHERE target_id = ? AND status = 'accepted'
	`
	err = db.DBService.DB.QueryRow(followerCountQuery, userID).Scan(&user.Followers)
	if err != nil {
		// Silently handle error for counts
		user.Followers = 0
	}

	// Calculate following count dynamically from follow_requests table
	followingCountQuery := `
		SELECT COUNT(*) 
		FROM follow_requests 
		WHERE requester_id = ? AND status = 'accepted'
	`
	err = db.DBService.DB.QueryRow(followingCountQuery, userID).Scan(&user.Followed)
	if err != nil {
		// Silently handle error for counts
		user.Followed = 0
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
		fmt.Printf("[API] Update profile failed: %v\n", err)
		http.Error(w, "Failed to update profile", http.StatusInternalServerError)
		return
	}

	// Check if privacy status changed from private to public
	var privacyChanged bool
	var wasPrivate bool
	if updateRequest.IsPrivate != nil {
		// Get current privacy status
		var currentIsPrivate bool
		err = tx.QueryRow("SELECT is_private FROM users WHERE id = ?", currentUserID).Scan(&currentIsPrivate)
		if err != nil {
			fmt.Printf("[API] Failed to get current privacy status: %v\n", err)
			http.Error(w, "Failed to get current privacy status", http.StatusInternalServerError)
			return
		}

		// Check if changing from private to public
		wasPrivate = currentIsPrivate
		privacyChanged = wasPrivate && !*updateRequest.IsPrivate
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		http.Error(w, "Failed to commit update", http.StatusInternalServerError)
		return
	}

	// Handle privacy change: auto-accept all pending follow requests
	if privacyChanged {
		err = autoAcceptPendingFollowRequests(int64(currentUserID))
		if err != nil {
			// Silently handle error for auto-acceptance
		}
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

// GetPublicUserProfileHandler allows fetching a user's profile without authentication.
// It returns limited data for private profiles and fuller data for public profiles.
func GetPublicUserProfileHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Only GET method allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse the target user id
	idParam := r.URL.Query().Get("id")
	if idParam == "" {
		http.Error(w, "Missing user id", http.StatusBadRequest)
		return
	}
	targetUserID, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil || targetUserID <= 0 {
		http.Error(w, "Invalid user id", http.StatusBadRequest)
		return
	}

	// Fetch user profile from database
	profile, err := getUserProfileFromDB(targetUserID)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Check if there's an authenticated user (optional for public endpoint)
	var isFollowing *bool
	currentUserID, hasAuth := r.Context().Value(middleware.UserIDKey).(int)
	if hasAuth && int64(currentUserID) != targetUserID {
		// User is authenticated and viewing someone else's profile
		following, err := db.DBService.IsFollowing(int64(currentUserID), targetUserID)
		if err == nil {
			isFollowing = &following
		}
	}

	// For public endpoint, never include sensitive fields like email/dob for other users
	// Private profile => minimal information
	// Public profile => public-safe information
	var response models.UserProfileResponse
	if profile.IsPrivate {
		response = models.UserProfileResponse{
			ID:          profile.ID,
			Nickname:    profile.Nickname,
			Avatar:      profile.GetAvatar(),
			IsPrivate:   profile.IsPrivate,
			CreatedAt:   profile.CreatedAt,
			Followers:   profile.Followers,
			Followed:    profile.Followed,
			IsFollowing: isFollowing,
		}
	} else {
		response = models.UserProfileResponse{
			ID:          profile.ID,
			Nickname:    profile.Nickname,
			FirstName:   profile.FirstName,
			LastName:    profile.LastName,
			Avatar:      profile.GetAvatar(),
			Bio:         profile.GetBio(),
			IsPrivate:   profile.IsPrivate,
			CreatedAt:   profile.CreatedAt,
			Followers:   profile.Followers,
			Followed:    profile.Followed,
			IsFollowing: isFollowing,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(response)
}

// autoAcceptPendingFollowRequests automatically accepts all pending follow requests when a user changes from private to public
func autoAcceptPendingFollowRequests(userID int64) error {
	// Get all pending follow requests for this user
	pendingRequests, err := db.DBService.GetPendingFollowRequests(userID)
	if err != nil {
		return fmt.Errorf("failed to get pending follow requests: %w", err)
	}

	// Process each pending request
	for _, request := range pendingRequests {
		// Update request status to accepted
		err = db.DBService.UpdateFollowRequestStatus(request.ID, "accepted")
		if err != nil {
			continue
		}

		// Increment counters
		db.DBService.IncrementFollowingCount(request.RequesterID)
		db.DBService.IncrementFollowersCount(userID)

		// Create notification for the requester
		targetUser, err := db.DBService.GetUserByID(userID)
		if err == nil {
			avatar := ""
			if targetUser.Avatar.Valid {
				avatar = targetUser.Avatar.String
			}
			notificationData := fmt.Sprintf(`{"target_id": %d, "target_nickname": "%s", "target_avatar": "%s", "type": "follow_accepted"}`,
				userID, targetUser.Nickname, avatar)
			notificationReq := models.CreateNotificationRequest{
				UserID: request.RequesterID,
				Type:   "follow_accepted",
				Data:   notificationData,
			}
			db.DBService.CreateNotification(notificationReq)
		}
	}

	return nil
}
