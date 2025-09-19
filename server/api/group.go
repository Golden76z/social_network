package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/Golden76z/social-network/middleware"

	//"github.com/Golden76z/social-network/config"
	"github.com/Golden76z/social-network/db"
	"github.com/Golden76z/social-network/models"
	"github.com/Golden76z/social-network/utils"
)

// Handler to create a new Group
func CreateGroupHandler(w http.ResponseWriter, r *http.Request) {
	// Get current user ID from context (injected by AuthMiddleware)
	currentUserID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	userID := int64(currentUserID)

	// Converting the JSON sent by client-side to struct
	var req models.CreateGroupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request fields
	// Title: required, 3-50 characters
	// Bio: optional, if provided, 3-500 characters
	// Avatar: optional, if provided, validate URL format
	if validationErrors := utils.ValidateStringLength(&req, 3, 50); len(validationErrors) > 0 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(validationErrors)
		return
	}

	// Additional validation for bio length (if provided)
	if req.Bio != "" && len(req.Bio) > 500 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode([]utils.ValidationError{
			{Field: "Bio", Message: "must be at most 500 characters"},
		})
		return
	}

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
	w.Header().Set("Content-Type", "application/json")

	// Support: /api/group (list) with optional pagination; /api/group?id=1; /api/group/{id}
	idParam := r.URL.Query().Get("id")
	if idParam == "" {
		// Try path param
		idParam = utils.GetPathParam(r, "id")
	}

	if idParam == "" {
		// No id provided → list all groups (minimal listing for debug) optionally with page/limit
		pageStr := r.URL.Query().Get("page")
		limitStr := r.URL.Query().Get("limit")
		_ = pageStr
		_ = limitStr
		// For now, reuse GetGroupByID pattern via a simple query function
		// Implement a basic listing from DB
		rows, err := db.DBService.DB.Query(`SELECT id, title, avatar, bio, creator_id, created_at, updated_at FROM groups ORDER BY created_at DESC LIMIT 50`)
		if err != nil {
			http.Error(w, "Error retrieving groups", http.StatusInternalServerError)
			return
		}
		defer rows.Close()
		var groups []models.GroupResponse
		for rows.Next() {
			var g models.GroupResponse
			if err := rows.Scan(&g.ID, &g.Title, &g.Avatar, &g.Bio, &g.CreatorID, &g.CreatedAt, &g.UpdatedAt); err != nil {
				http.Error(w, "Error scanning groups", http.StatusInternalServerError)
				return
			}
			groups = append(groups, g)
		}
		json.NewEncoder(w).Encode(groups)
		return
	}

	groupID, err := strconv.Atoi(idParam)
	if err != nil || groupID <= 0 {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

	// Query DB by id
	group, err := db.DBService.GetGroupByID(int64(groupID))
	if err != nil {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}

	// Return result
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(group)
}

// Handler to get groups that the current user is a member of
func GetUserGroupsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Get current user ID from context (injected by AuthMiddleware)
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Query to get groups where user is a member
	query := `
		SELECT g.id, g.title, g.avatar, g.bio, g.creator_id, g.created_at, g.updated_at 
		FROM groups g
		INNER JOIN group_members gm ON g.id = gm.group_id
		WHERE gm.user_id = ?
		ORDER BY g.created_at DESC
	`

	rows, err := db.DBService.DB.Query(query, userID)
	if err != nil {
		http.Error(w, "Error retrieving user groups", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var groups []models.GroupResponse
	for rows.Next() {
		var g models.GroupResponse
		if err := rows.Scan(&g.ID, &g.Title, &g.Avatar, &g.Bio, &g.CreatorID, &g.CreatedAt, &g.UpdatedAt); err != nil {
			http.Error(w, "Error scanning user groups", http.StatusInternalServerError)
			return
		}
		groups = append(groups, g)
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(groups)
}

// Handler to update a group
func UpdateGroupHandler(w http.ResponseWriter, r *http.Request) {
	// Get current user ID from context (injected by AuthMiddleware)
	currentUserID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Converting the JSON sent by client-side to struct
	var req models.UpdateGroupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		fmt.Println("Error: ", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Extract the group ID from query or path
	idParam := r.URL.Query().Get("id")
	if idParam == "" {
		idParam = utils.GetPathParam(r, "id")
	}
	groupID, err := strconv.Atoi(idParam)
	if err != nil || groupID <= 0 {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

	req.ID = int64(groupID)
	userID := int64(currentUserID)

	// Validate group ID
	if req.ID <= 0 {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

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
	// Get current user ID from context (injected by AuthMiddleware)
	currentUserID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	userID := int64(currentUserID)

	// Extract the group ID from query or path
	idParam := r.URL.Query().Get("id")
	if idParam == "" {
		idParam = utils.GetPathParam(r, "id")
	}
	groupID, err := strconv.Atoi(idParam)
	if err != nil || groupID <= 0 {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

	// Validate group ID
	if groupID <= 0 {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

	// Check if user is the creator of the group
	group, errGet := db.DBService.GetGroupByID(int64(groupID))
	if errGet != nil {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}

	if group.CreatorID != userID {
		http.Error(w, "Only the group creator can delete the group", http.StatusForbidden)
		return
	}

	// Delete group from database
	errDB := db.DBService.DeleteGroup(int64(groupID))
	if errDB != nil {
		http.Error(w, "Error deleting the group", http.StatusInternalServerError)
		return
	}

	// Send back a response to the client-side in case of success
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"response": "Group successfully deleted"}`))
}
