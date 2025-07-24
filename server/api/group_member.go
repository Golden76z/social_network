package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/Golden76z/social-network/db"
	"github.com/Golden76z/social-network/middleware"
	"github.com/Golden76z/social-network/models"
	"github.com/Golden76z/social-network/utils"
)

// Handler to invite an user to a group
func CreateGroupMemberHandler(w http.ResponseWriter, r *http.Request) {
	// Converting the JSON sent by client-side to struct
	var req models.GroupMember
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Calling the Database to create the new Group Member Invitation
	errDB := db.DBService.CreateGroupMember(req)
	if errDB != nil {
		http.Error(w, "Error creating the group member invitation", http.StatusInternalServerError)
		return
	}

	// Send back a response to the client-side in case of success
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"response": "Group member successfuly got created"}`))
}

// Handler to get the member list of a group
func GetGroupMembersHandler(w http.ResponseWriter, r *http.Request) {
	// Get current user ID from context (injected by AuthMiddleware)
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse query parameters for pagination and group ID
	query := r.URL.Query()
	offsetStr := query.Get("offset")
	groupIdStr := query.Get("id")

	w.Header().Set("Content-Type", "application/json")

	// Convert offset to int and groupID to int64
	offSet, errOffSet := strconv.Atoi(offsetStr)
	groupID, errGroupID := strconv.ParseInt(groupIdStr, 10, 64)
	if errOffSet != nil || errGroupID != nil {
		http.Error(w, "Missing id or offlimit query parameter", http.StatusBadRequest)
		return
	}

	fmt.Println("UserID: ", userID)
	fmt.Println("GroupID: ", groupID)

	// Calling the Database to get the group members
	members, errDB := db.DBService.GetGroupMembers(groupID, offSet, int64(userID))
	if errDB != nil {
		fmt.Println("Error: ", errDB)
		http.Error(w, "Error retrieving group members", http.StatusInternalServerError)
		return
	}

	// Send back the members list to the client-side
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]any{
		"response": "Group members retrieved successfully",
		"members":  members,
	})
}

// Handler to update a group member's role or status
func UpdateGroupMemberHandler(w http.ResponseWriter, r *http.Request) {
	// Get current user ID from context (injected by AuthMiddleware)
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse and decode the request body
	var req models.UpdateGroupMemberRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request fields
	if validationErrors := utils.ValidateStringLength(&req, 1, 50); len(validationErrors) > 0 || (req.Role != "admin" && req.Role != "member") {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(validationErrors)
		return
	}

	// Update the group member in the database
	errDB := db.DBService.UpdateGroupMemberRole(req, int64(userID))
	if errDB != nil {
		http.Error(w, "Failed to update group member", http.StatusInternalServerError)
		return
	}

	// Send success response
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"response": "Group member updated successfully"}`))
}

// Handler to delete an user from a group
func DeleteGroupMemberHandler(w http.ResponseWriter, r *http.Request) {
	// Get current user ID from context (injected by AuthMiddleware)
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Converting the JSON sent by client-side to struct
	var req models.LeaveGroupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request fields
	if validationErrors := utils.ValidateStringLength(&req, 1, 50); len(validationErrors) > 0 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(validationErrors)
		return
	}

	// Calling the Database to remove the user from the group
	errDB := db.DBService.DeleteGroupMember(req, userID)
	if errDB != nil {
		http.Error(w, "Error leaving the group", http.StatusInternalServerError)
		return
	}

	// Send back a response to the client-side in case of success
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"response": "Group member succesfuly got deleted"}`))
}
