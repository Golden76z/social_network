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

// CreateGroupRequestHandler creates a new group join request
func CreateGroupRequestHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("🔍 CreateGroupRequestHandler called")
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		fmt.Println("❌ UserID not found in context")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	fmt.Printf("✅ UserID found: %d\n", userID)

	var req struct {
		GroupID int64 `json:"group_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		fmt.Printf("❌ Error decoding request body: %v\n", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	fmt.Printf("✅ Request decoded: GroupID=%d\n", req.GroupID)

	if req.GroupID <= 0 {
		fmt.Println("❌ Invalid group_id")
		http.Error(w, "Invalid group_id", http.StatusBadRequest)
		return
	}

	// Check if group exists
	exists, err := db.DBService.GroupExists(req.GroupID)
	if err != nil {
		http.Error(w, "Error checking group existence", http.StatusInternalServerError)
		return
	}
	if !exists {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}

	// Check if user is already a member
	isMember, err := db.DBService.IsUserInGroup(int64(userID), req.GroupID)
	if err != nil {
		http.Error(w, "Error checking membership", http.StatusInternalServerError)
		return
	}
	if isMember {
		http.Error(w, "User is already a member of this group", http.StatusConflict)
		return
	}

	// Check if user already has a pending request
	hasPendingRequest, err := db.DBService.HasPendingGroupRequest(int64(userID), req.GroupID)
	if err != nil {
		http.Error(w, "Error checking existing requests", http.StatusInternalServerError)
		return
	}
	if hasPendingRequest {
		http.Error(w, "User already has a pending request for this group", http.StatusConflict)
		return
	}

	// Create the group request
	fmt.Printf("🔄 Creating group request: GroupID=%d, UserID=%d\n", req.GroupID, userID)
	err = db.DBService.CreateGroupRequest(req.GroupID, int64(userID), "pending")
	if err != nil {
		fmt.Printf("❌ Error creating group request: %v\n", err)
		http.Error(w, "Error creating group request", http.StatusInternalServerError)
		return
	}
	fmt.Println("✅ Group request created successfully")

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	response := map[string]interface{}{
		"message":  "Group join request created successfully",
		"group_id": req.GroupID,
		"user_id":  userID,
		"status":   "pending",
	}
	fmt.Printf("📤 Sending response: %+v\n", response)
	json.NewEncoder(w).Encode(response)
	fmt.Println("✅ Response sent successfully")
}

// GetUserPendingRequestsHandler gets all pending requests for the current user
func GetUserPendingRequestsHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	requests, err := db.DBService.GetUserPendingRequests(int64(userID))
	if err != nil {
		http.Error(w, "Error fetching pending requests", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"requests": requests,
	})
}

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
