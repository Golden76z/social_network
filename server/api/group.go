package api

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/Golden76z/social-network/config"
	"github.com/Golden76z/social-network/db"
	"github.com/Golden76z/social-network/models"
	"github.com/Golden76z/social-network/utils"
)

// Handler to create a new Group
func CreateGroupHandler(w http.ResponseWriter, r *http.Request) {
	// Retrieving user's informations via the JWT stored in the cookie
	claims, errToken := utils.TokenInformations(w, r, config.GetConfig().JWTKey)
	if errToken != nil {
		http.Error(w, "Error retrieving the token informations", http.StatusMethodNotAllowed)
		return
	}

	// Converting the JSON sent by client-side to struct
	var req models.CreateGroupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request fields
	if validationErrors := utils.ValidateStringLength(&req, 3, 100); len(validationErrors) > 0 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(validationErrors)
		return
	}

	// Type assertion for user_id
	userIDFloat, ok := claims["user_id"].(float64)
	if !ok {
		http.Error(w, "Invalid user ID in token", http.StatusBadRequest)
		return
	}
	userID := int64(userIDFloat)

	// Calling the Database to create the new Group
	errDB := db.DBService.CreateGroup(req, userID)
	if errDB != nil {
		http.Error(w, "Error creating the group", http.StatusInternalServerError)
		return
	}

	// Send back a response to the client-side in case of success
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"response": "Group successfully created"}`))
}

// Handler to get a group by ID
func GetGroupHandler(w http.ResponseWriter, r *http.Request) {
	// Retrieving user's informations via the JWT stored in the cookie
	_, errToken := utils.TokenInformations(w, r, config.GetConfig().JWTKey)
	if errToken != nil {
		http.Error(w, "Error retrieving the token informations", http.StatusUnauthorized)
		return
	}

	// Extract group ID from URL path
	// Assuming URL pattern like /groups/{id}
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 3 {
		http.Error(w, "Invalid URL format", http.StatusBadRequest)
		return
	}

	groupIDStr := pathParts[len(pathParts)-1]
	groupID, err := strconv.ParseInt(groupIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

	// Get group from database
	group, errDB := db.DBService.GetGroupByID(groupID)
	if errDB != nil {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}

	// Send response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(group)
}

// Handler to update a group
func UpdateGroupHandler(w http.ResponseWriter, r *http.Request) {
	// Retrieving user's informations via the JWT stored in the cookie
	claims, errToken := utils.TokenInformations(w, r, config.GetConfig().JWTKey)
	if errToken != nil {
		http.Error(w, "Error retrieving the token informations", http.StatusUnauthorized)
		return
	}

	// Converting the JSON sent by client-side to struct
	var req models.UpdateGroupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate group ID
	if req.ID <= 0 {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

	// Type assertion for user_id
	userIDFloat, ok := claims["user_id"].(float64)
	if !ok {
		http.Error(w, "Invalid user ID in token", http.StatusBadRequest)
		return
	}
	userID := int64(userIDFloat)

	// Check if user is the creator of the group
	group, errGet := db.DBService.GetGroupByID(req.ID)
	if errGet != nil {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}

	if group.CreatorID != userID {
		http.Error(w, "Only the group creator can update the group", http.StatusForbidden)
		return
	}

	// Validate request fields if they are provided
	if req.Title != nil && (len(*req.Title) < 3 || len(*req.Title) > 100) {
		http.Error(w, "Title must be between 3 and 100 characters", http.StatusBadRequest)
		return
	}

	if req.Bio != nil && len(*req.Bio) > 500 {
		http.Error(w, "Bio must be less than 500 characters", http.StatusBadRequest)
		return
	}

	// Update group in database
	errDB := db.DBService.UpdateGroup(req.ID, req)
	if errDB != nil {
		http.Error(w, "Error updating the group", http.StatusInternalServerError)
		return
	}

	// Send back a response to the client-side in case of success
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"response": "Group successfully updated"}`))
}

// Handler to delete a group
func DeleteGroupHandler(w http.ResponseWriter, r *http.Request) {
	// Retrieving user's informations via the JWT stored in the cookie
	claims, errToken := utils.TokenInformations(w, r, config.GetConfig().JWTKey)
	if errToken != nil {
		http.Error(w, "Error retrieving the token informations", http.StatusUnauthorized)
		return
	}

	// Converting the JSON sent by client-side to struct
	var req models.DeleteGroupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate group ID
	if req.ID <= 0 {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

	// Type assertion for user_id
	userIDFloat, ok := claims["user_id"].(float64)
	if !ok {
		http.Error(w, "Invalid user ID in token", http.StatusBadRequest)
		return
	}
	userID := int64(userIDFloat)

	// Check if user is the creator of the group
	group, errGet := db.DBService.GetGroupByID(req.ID)
	if errGet != nil {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}

	if group.CreatorID != userID {
		http.Error(w, "Only the group creator can delete the group", http.StatusForbidden)
		return
	}

	// Delete group from database
	errDB := db.DBService.DeleteGroup(req.ID)
	if errDB != nil {
		http.Error(w, "Error deleting the group", http.StatusInternalServerError)
		return
	}

	// Send back a response to the client-side in case of success
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"response": "Group successfully deleted"}`))
}
