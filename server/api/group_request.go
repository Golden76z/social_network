package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/Golden76z/social-network/db"
	"github.com/Golden76z/social-network/middleware"
	"github.com/Golden76z/social-network/models"
)

// GetGroupRequestsHandler lists join requests for a group (group owner only)
func GetGroupRequestsHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	query := r.URL.Query()
	groupIDStr := query.Get("group_id")
	if groupIDStr == "" {
		http.Error(w, "Missing group_id parameter", http.StatusBadRequest)
		return
	}

	groupID, err := strconv.ParseInt(groupIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid group_id", http.StatusBadRequest)
		return
	}

	// Check if user is group owner
	isOwner, err := db.DBService.IsUserGroupAdmin(int64(userID), groupID)
	if err != nil {
		http.Error(w, "Error checking ownership", http.StatusInternalServerError)
		return
	}
	if !isOwner {
		http.Error(w, "Forbidden: Only group owner can view requests", http.StatusForbidden)
		return
	}

	status := query.Get("status") // optional filter: pending, accepted, declined
	limitStr := query.Get("limit")
	offsetStr := query.Get("offset")

	limit := 20 // default
	if limitStr != "" {
		if parsed, err := strconv.Atoi(limitStr); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	offset := 0 // default
	if offsetStr != "" {
		if parsed, err := strconv.Atoi(offsetStr); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	requests, err := db.DBService.GetGroupRequestsByGroup(groupID, status, limit, offset)
	if err != nil {
		http.Error(w, "Error retrieving requests", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(requests)
}

// UpdateGroupRequestHandler approves or declines a join request (group owner only)
func UpdateGroupRequestHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		ID     int64  `json:"id"`
		Status string `json:"status"` // "accepted" or "declined"
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.ID == 0 {
		http.Error(w, "Missing request ID", http.StatusBadRequest)
		return
	}

	if req.Status != "accepted" && req.Status != "declined" {
		http.Error(w, "Status must be 'accepted' or 'declined'", http.StatusBadRequest)
		return
	}

	// Get the request to verify ownership
	request, err := db.DBService.GetGroupRequestByID(req.ID)
	if err != nil {
		http.Error(w, "Request not found", http.StatusNotFound)
		return
	}

	// Check if user is group owner
	isOwner, err := db.DBService.IsUserGroupAdmin(int64(userID), request.GroupID)
	if err != nil {
		http.Error(w, "Error checking ownership", http.StatusInternalServerError)
		return
	}
	if !isOwner {
		http.Error(w, "Forbidden: Only group owner can approve/decline requests", http.StatusForbidden)
		return
	}

	// Check if request is still pending
	if request.Status != "pending" {
		http.Error(w, "Request has already been processed", http.StatusBadRequest)
		return
	}

	// Update request status
	if err := db.DBService.UpdateGroupRequestStatus(req.ID, req.Status); err != nil {
		http.Error(w, "Error updating request", http.StatusInternalServerError)
		return
	}

	// If accepted, add user to group
	if req.Status == "accepted" {
		// Set the group owner as the one who invited (approved the request)
		invitedBy := int64(userID)
		member := models.GroupMember{
			GroupID:   request.GroupID,
			UserID:    request.UserID,
			Role:      "member",
			InvitedBy: &invitedBy,
		}
		fmt.Printf("Creating group member: GroupID=%d, UserID=%d, Role=%s, InvitedBy=%d\n", member.GroupID, member.UserID, member.Role, *member.InvitedBy)
		if err := db.DBService.CreateGroupMember(member); err != nil {
			// Rollback request status if member creation fails
			fmt.Printf("Error creating group member: %v\n", err)
			db.DBService.UpdateGroupRequestStatus(req.ID, "pending")
			http.Error(w, "Error adding user to group: "+err.Error(), http.StatusInternalServerError)
			return
		}
		fmt.Printf("Successfully created group member for user %d in group %d\n", member.UserID, member.GroupID)
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"response": "Request updated successfully"}`))
}

// DeleteGroupRequestHandler cancels a join request (request owner only)
func DeleteGroupRequestHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		ID int64 `json:"id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.ID == 0 {
		http.Error(w, "Missing request ID", http.StatusBadRequest)
		return
	}

	// Get the request to verify ownership
	request, err := db.DBService.GetGroupRequestByID(req.ID)
	if err != nil {
		http.Error(w, "Request not found", http.StatusNotFound)
		return
	}

	// Check if user is the requester
	if request.UserID != int64(userID) {
		http.Error(w, "Forbidden: You can only cancel your own requests", http.StatusForbidden)
		return
	}

	// Check if request is still pending
	if request.Status != "pending" {
		http.Error(w, "Request has already been processed", http.StatusBadRequest)
		return
	}

	// Delete the request
	if err := db.DBService.DeleteGroupRequest(req.ID); err != nil {
		http.Error(w, "Error canceling request", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"response": "Request canceled successfully"}`))
}
