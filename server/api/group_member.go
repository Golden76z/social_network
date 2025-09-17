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
	// Convert this endpoint into a 'request to join' creator that creates a pending group request
	currentUserID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	groupIDVal, ok := body["group_id"]
	if !ok {
		http.Error(w, "Missing group_id", http.StatusBadRequest)
		return
	}
	var groupID int64
	switch v := groupIDVal.(type) {
	case float64:
		groupID = int64(v)
	case int:
		groupID = int64(v)
	case int64:
		groupID = v
	case string:
		if parsed, err := strconv.ParseInt(v, 10, 64); err == nil {
			groupID = parsed
		}
	}
	if groupID == 0 {
		http.Error(w, "Invalid group_id", http.StatusBadRequest)
		return
	}

	// Ensure group exists
	exists, err := db.DBService.GroupExists(groupID)
	if err != nil {
		http.Error(w, "Error checking group existence", http.StatusInternalServerError)
		return
	}
	if !exists {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}

	// If already member, short-circuit
	isMember, err := db.DBService.IsUserInGroup(int64(currentUserID), groupID)
	if err != nil {
		http.Error(w, "Error checking membership", http.StatusInternalServerError)
		return
	}
	if isMember {
		http.Error(w, "User is already a member of the group", http.StatusBadRequest)
		return
	}

	// Check for existing request
	if existing, _ := db.DBService.GetGroupRequestByGroupAndUser(groupID, int64(currentUserID)); existing != nil && existing.Status == "pending" {
		http.Error(w, "A pending request already exists", http.StatusBadRequest)
		return
	}

	if err := db.DBService.CreateGroupRequest(groupID, int64(currentUserID), "pending"); err != nil {
		http.Error(w, "Error creating join request", http.StatusInternalServerError)
		return
	}

	// Notify group creator (if needed you can expand recipients later)
	group, _ := db.DBService.GetGroupByID(groupID)
	_ = db.DBService.CreateNotification(models.CreateNotificationRequest{
		UserID: group.CreatorID,
		Type:   "group_join_request",
		Data:   fmt.Sprintf("{\"group_id\":%d,\"user_id\":%d}", groupID, currentUserID),
	})

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"response": "Join request created"}`))
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
		switch errDB.Error() {
		case "not authorized: requester is not an admin of this group":
			http.Error(w, "Forbidden: requester is not an admin of this group", http.StatusForbidden)
			return
		case "member not found in this group":
			http.Error(w, "Member not found in this group", http.StatusNotFound)
			return
		case "member already has the requested role":
			http.Error(w, "Member already has the requested role", http.StatusBadRequest)
			return
		case "cannot demote: would remove the last admin from the group":
			http.Error(w, "Cannot demote the last admin", http.StatusBadRequest)
			return
		default:
			http.Error(w, "Failed to update group member: "+errDB.Error(), http.StatusInternalServerError)
			return
		}
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
