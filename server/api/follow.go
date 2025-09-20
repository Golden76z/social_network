package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/Golden76z/social-network/db"
	"github.com/Golden76z/social-network/middleware"
	"github.com/Golden76z/social-network/models"
)

// GetFollowRequestHandler returns all pending follow requests for the current user (where the user is the target)
func GetFollowRequestHandler(w http.ResponseWriter, r *http.Request) {
	currentUserID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	userID := int64(currentUserID)

	requests, err := db.DBService.GetPendingFollowRequests(userID)
	if err != nil {
		http.Error(w, "Error fetching follow requests", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(requests)
}

// CreateFollowHandler handles follow requests. If the target user is public, the request is auto-accepted. If private, a pending request is created (can be resent if last was declined).
func CreateFollowHandler(w http.ResponseWriter, r *http.Request) {
	currentUserID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	userID := int64(currentUserID)

	var req models.CreateFollowRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Prevent self-follow
	if req.TargetID == userID {
		http.Error(w, "You cannot follow yourself", http.StatusBadRequest)
		return
	}

	// Check if target user exists
	targetUser, err := db.DBService.GetUserByID(req.TargetID)
	if err != nil {
		http.Error(w, "Target user not found", http.StatusBadRequest)
		return
	}

	// Check for existing follow request (pending or accepted)
	existing, err := db.DBService.GetFollowRequestBetween(userID, req.TargetID)
	if err == nil {
		if existing.Status == "accepted" {
			// Already following - return success message
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(map[string]string{"message": "You are already following this user"})
			return
		}
		if existing.Status == "pending" {
			// Request already pending - return success message
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(map[string]string{"message": "Follow request already pending"})
			return
		}
		// If there's a declined/rejected request, we can allow a new follow request
	}

	// If public profile, auto-accept
	if !targetUser.IsPrivate {
		err := db.DBService.CreateFollowRequest(userID, req.TargetID, "accepted")
		if err != nil {
			// Check if it's a unique constraint violation (duplicate key)
			if strings.Contains(err.Error(), "UNIQUE constraint failed") {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusOK)
				json.NewEncoder(w).Encode(map[string]string{"message": "You are already following this user"})
				return
			}
			http.Error(w, "Error creating follow relationship", http.StatusInternalServerError)
			return
		}
		// Increment counts (pseudo-code, implement in DB as needed)
		_ = db.DBService.IncrementFollowingCount(userID)
		_ = db.DBService.IncrementFollowersCount(req.TargetID)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{"message": "You are now following this user"})
		return
	}

	// If private profile, create a pending request (allow resending if last was declined)
	err = db.DBService.CreateFollowRequest(userID, req.TargetID, "pending")
	if err != nil {
		// Check if it's a unique constraint violation (duplicate key)
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(map[string]string{"message": "Follow request already pending"})
			return
		}
		http.Error(w, "Error creating follow request", http.StatusInternalServerError)
		return
	}

	// Create notification for the target user about the follow request
	notificationData := fmt.Sprintf(`{"requester_id": %d, "requester_nickname": "%s", "type": "follow_request"}`,
		userID, targetUser.Nickname)
	notificationReq := models.CreateNotificationRequest{
		UserID: req.TargetID,
		Type:   "follow_request",
		Data:   notificationData,
	}

	// Don't fail the follow request if notification creation fails
	if err := db.DBService.CreateNotification(notificationReq); err != nil {
		fmt.Printf("[WARNING] Failed to create notification for follow request: %v\n", err)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Follow request sent"})
}

// GetFollowerHandler returns the list of users who follow the specified user (followers)
func GetFollowerHandler(w http.ResponseWriter, r *http.Request) {
	currentUserID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get target user ID from query parameter
	targetUserIDStr := r.URL.Query().Get("userId")
	var targetUserID int64
	var err error

	if targetUserIDStr == "" {
		// No userId parameter, return current user's followers
		targetUserID = int64(currentUserID)
	} else {
		targetUserID, err = strconv.ParseInt(targetUserIDStr, 10, 64)
		if err != nil {
			http.Error(w, "Invalid user ID format", http.StatusBadRequest)
			return
		}
	}

	followers, err := db.DBService.GetFollowers(targetUserID)
	if err != nil {
		http.Error(w, "Error fetching followers", http.StatusInternalServerError)
		return
	}

	// Transform User objects to UserDisplayInfo format
	var displayInfo []map[string]interface{}
	for _, user := range followers {
		displayInfo = append(displayInfo, map[string]interface{}{
			"id":         user.ID,
			"nickname":   user.Nickname,
			"fullName":   fmt.Sprintf("%s %s", user.FirstName, user.LastName),
			"first_name": user.FirstName,
			"last_name":  user.LastName,
			"avatar":     user.GetAvatar(),
			"is_private": user.IsPrivate,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(displayInfo)
}

// GetFollowingHandler returns the list of users the specified user is following
func GetFollowingHandler(w http.ResponseWriter, r *http.Request) {
	currentUserID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get target user ID from query parameter
	targetUserIDStr := r.URL.Query().Get("userId")
	var targetUserID int64
	var err error

	if targetUserIDStr == "" {
		// No userId parameter, return current user's following
		targetUserID = int64(currentUserID)
	} else {
		targetUserID, err = strconv.ParseInt(targetUserIDStr, 10, 64)
		if err != nil {
			http.Error(w, "Invalid user ID format", http.StatusBadRequest)
			return
		}
	}

	following, err := db.DBService.GetFollowing(targetUserID)
	if err != nil {
		http.Error(w, "Error fetching following", http.StatusInternalServerError)
		return
	}

	// Transform User objects to UserDisplayInfo format
	var displayInfo []map[string]interface{}
	for _, user := range following {
		displayInfo = append(displayInfo, map[string]interface{}{
			"id":         user.ID,
			"nickname":   user.Nickname,
			"fullName":   fmt.Sprintf("%s %s", user.FirstName, user.LastName),
			"first_name": user.FirstName,
			"last_name":  user.LastName,
			"avatar":     user.GetAvatar(),
			"is_private": user.IsPrivate,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(displayInfo)
}

// UpdateFollowHandler allows the target user to accept or decline a follow request. Only 'accepted' or 'declined' are valid statuses. If already in the requested status, returns an error.
func UpdateFollowHandler(w http.ResponseWriter, r *http.Request) {
	currentUserID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	userID := int64(currentUserID)

	var req struct {
		RequestID int64  `json:"request_id"`
		Status    string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Check that the request exists and the current user is the target
	followReq, err := db.DBService.GetFollowRequestByID(req.RequestID)
	if err != nil {
		http.Error(w, "Follow request not found", http.StatusNotFound)
		return
	}
	if followReq.TargetID != userID {
		http.Error(w, "Not authorized to update this follow request", http.StatusForbidden)
		return
	}

	// Only 'accepted' or 'declined' are valid statuses for the DB
	if req.Status != "accepted" && req.Status != "rejected" && req.Status != "declined" {
		http.Error(w, "Invalid status", http.StatusBadRequest)
		return
	}

	// Normalize the declined status to 'declined' for the DB
	dbStatus := req.Status
	if req.Status == "rejected" {
		dbStatus = "declined"
	}

	// Do not allow update if the status is already the requested one
	if followReq.Status == dbStatus {
		http.Error(w, "Request already has this status", http.StatusBadRequest)
		return
	}

	err = db.DBService.UpdateFollowRequestStatus(req.RequestID, dbStatus)
	if err != nil {
		http.Error(w, "Error updating follow request", http.StatusInternalServerError)
		return
	}

	// If accepted, increment counters
	if dbStatus == "accepted" {
		_ = db.DBService.IncrementFollowingCount(followReq.RequesterID)
		_ = db.DBService.IncrementFollowersCount(followReq.TargetID)
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Follow request updated"}`))
}

// DeleteFollowHandler allows the requester or the target to delete a follow relationship or a follow request (unfollow or cancel request)
func DeleteFollowHandler(w http.ResponseWriter, r *http.Request) {
	currentUserID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	userID := int64(currentUserID)

	var req struct {
		TargetID int64 `json:"target_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Search for the follow request in both directions (unfollow or cancel request)
	followReq, err := db.DBService.GetFollowRequestBetween(userID, req.TargetID)
	if err != nil {
		// Peut-être que c'est l'autre qui nous suit
		followReq, err = db.DBService.GetFollowRequestBetween(req.TargetID, userID)
		if err != nil {
			http.Error(w, "Follow request not found", http.StatusNotFound)
			return
		}
	}

	// Only the requester or the target can delete the relationship
	if followReq.RequesterID != userID && followReq.TargetID != userID {
		http.Error(w, "Not authorized to delete this follow request", http.StatusForbidden)
		return
	}

	err = db.DBService.DeleteFollowRequest(followReq.ID)
	if err != nil {
		http.Error(w, "Error deleting follow request", http.StatusInternalServerError)
		return
	}

	// If the relationship was accepted, decrement counters
	if followReq.Status == "accepted" {
		_ = db.DBService.DecrementFollowingCount(followReq.RequesterID)
		_ = db.DBService.DecrementFollowersCount(followReq.TargetID)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Follow request deleted"})
}

// AcceptFollowRequestHandler accepts a pending follow request
func AcceptFollowRequestHandler(w http.ResponseWriter, r *http.Request) {
	currentUserID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		RequesterID int64 `json:"requester_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Find the pending follow request
	followReq, err := db.DBService.GetFollowRequestBetween(req.RequesterID, int64(currentUserID))
	if err != nil {
		http.Error(w, "Follow request not found", http.StatusNotFound)
		return
	}

	if followReq.Status != "pending" {
		http.Error(w, "Follow request is not pending", http.StatusBadRequest)
		return
	}

	// Update the follow request status to accepted
	err = db.DBService.UpdateFollowRequestStatus(followReq.ID, "accepted")
	if err != nil {
		http.Error(w, "Error accepting follow request", http.StatusInternalServerError)
		return
	}

	// Increment counters
	_ = db.DBService.IncrementFollowingCount(req.RequesterID)
	_ = db.DBService.IncrementFollowersCount(int64(currentUserID))

	// Create notification for the requester
	requester, err := db.DBService.GetUserByID(req.RequesterID)
	if err == nil {
		notificationData := fmt.Sprintf(`{"target_id": %d, "target_nickname": "%s", "type": "follow_accepted"}`,
			currentUserID, requester.Nickname)
		notificationReq := models.CreateNotificationRequest{
			UserID: req.RequesterID,
			Type:   "follow_accepted",
			Data:   notificationData,
		}
		if err := db.DBService.CreateNotification(notificationReq); err != nil {
			fmt.Printf("[WARNING] Failed to create notification for follow acceptance: %v\n", err)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Follow request accepted"})
}

// DeclineFollowRequestHandler declines a pending follow request
func DeclineFollowRequestHandler(w http.ResponseWriter, r *http.Request) {
	currentUserID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		RequesterID int64 `json:"requester_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Find the pending follow request
	followReq, err := db.DBService.GetFollowRequestBetween(req.RequesterID, int64(currentUserID))
	if err != nil {
		http.Error(w, "Follow request not found", http.StatusNotFound)
		return
	}

	if followReq.Status != "pending" {
		http.Error(w, "Follow request is not pending", http.StatusBadRequest)
		return
	}

	// Update the follow request status to declined
	err = db.DBService.UpdateFollowRequestStatus(followReq.ID, "declined")
	if err != nil {
		http.Error(w, "Error declining follow request", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Follow request declined"})
}

// CancelFollowRequestHandler cancels a pending follow request (for the requester)
func CancelFollowRequestHandler(w http.ResponseWriter, r *http.Request) {
	currentUserID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		TargetID int64 `json:"target_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Find the pending follow request
	followReq, err := db.DBService.GetFollowRequestBetween(int64(currentUserID), req.TargetID)
	if err != nil {
		http.Error(w, "Follow request not found", http.StatusNotFound)
		return
	}

	if followReq.Status != "pending" {
		http.Error(w, "Follow request is not pending", http.StatusBadRequest)
		return
	}

	// Delete the follow request
	err = db.DBService.DeleteFollowRequest(followReq.ID)
	if err != nil {
		http.Error(w, "Error canceling follow request", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Follow request canceled"})
}

// GetMutualFriendsHandler returns the list of users who follow the current user AND are followed back (mutual friends)
func GetMutualFriendsHandler(w http.ResponseWriter, r *http.Request) {
	currentUserID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	userID := int64(currentUserID)

	// Get target user ID from query parameter
	targetUserIDStr := r.URL.Query().Get("userId")
	var targetUserID int64
	var err error

	if targetUserIDStr == "" {
		// No userId parameter, return current user's mutual friends
		targetUserID = userID
	} else {
		targetUserID, err = strconv.ParseInt(targetUserIDStr, 10, 64)
		if err != nil {
			http.Error(w, "Invalid user ID format", http.StatusBadRequest)
			return
		}
	}

	mutualFriends, err := db.DBService.GetMutualFriends(targetUserID)
	if err != nil {
		http.Error(w, "Error fetching mutual friends", http.StatusInternalServerError)
		return
	}

	// Transform User objects to UserDisplayInfo format
	var displayInfo []map[string]interface{}
	for _, user := range mutualFriends {
		displayInfo = append(displayInfo, map[string]interface{}{
			"id":         user.ID,
			"nickname":   user.Nickname,
			"fullName":   fmt.Sprintf("%s %s", user.FirstName, user.LastName),
			"first_name": user.FirstName,
			"last_name":  user.LastName,
			"avatar":     user.GetAvatar(),
			"is_private": user.IsPrivate,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(displayInfo)
}
