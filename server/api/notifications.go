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

// GetUserNotificationsHandler gets notifications for the current user
func GetUserNotificationsHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	query := r.URL.Query()
	limitStr := query.Get("limit")
	offsetStr := query.Get("offset")
	unreadOnly := query.Get("unread_only") == "true"

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

	notifications, err := db.DBService.GetUserNotifications(int64(userID), limit, offset, unreadOnly)
	if err != nil {
		http.Error(w, "Error retrieving notifications", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(notifications)
}

// SendUserNotificationsHandler creates a notification for a user
func SendUserNotificationsHandler(w http.ResponseWriter, r *http.Request) {
	var req models.CreateNotificationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.UserID == 0 || req.Type == "" {
		http.Error(w, "Missing required fields: user_id, type", http.StatusBadRequest)
		return
	}

	if err := db.DBService.CreateNotification(req); err != nil {
		http.Error(w, "Error creating notification", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"response": "Notification sent"}`))
}

// UpdateUserNotificationsHandler marks notifications as read/unread
func UpdateUserNotificationsHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		ID     int64 `json:"id"`
		IsRead bool  `json:"is_read"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.ID == 0 {
		http.Error(w, "Missing notification ID", http.StatusBadRequest)
		return
	}

	// Verify notification belongs to user
	notification, err := db.DBService.GetNotificationByID(req.ID)
	if err != nil {
		http.Error(w, "Notification not found", http.StatusNotFound)
		return
	}

	if notification.UserID != int64(userID) {
		http.Error(w, "Forbidden: You can only update your own notifications", http.StatusForbidden)
		return
	}

	updateReq := models.UpdateNotificationRequest{IsRead: req.IsRead}
	if err := db.DBService.UpdateNotification(req.ID, updateReq); err != nil {
		http.Error(w, "Error updating notification", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"response": "Notification updated"}`))
}

// DeleteUserNotificationsHandler deletes a notification
func DeleteUserNotificationsHandler(w http.ResponseWriter, r *http.Request) {
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
		http.Error(w, "Missing notification ID", http.StatusBadRequest)
		return
	}

	// Verify notification belongs to user
	notification, err := db.DBService.GetNotificationByID(req.ID)
	if err != nil {
		http.Error(w, "Notification not found", http.StatusNotFound)
		return
	}

	if notification.UserID != int64(userID) {
		http.Error(w, "Forbidden: You can only delete your own notifications", http.StatusForbidden)
		return
	}

	if err := db.DBService.DeleteNotification(req.ID); err != nil {
		http.Error(w, "Error deleting notification", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"response": "Notification deleted"}`))
}

// AcceptNotificationHandler handles accepting notifications (follow requests, group requests, etc.)
func AcceptNotificationHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		NotificationID int64 `json:"notification_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.NotificationID == 0 {
		http.Error(w, "Missing notification ID", http.StatusBadRequest)
		return
	}

	// Get notification
	notification, err := db.DBService.GetNotificationByID(req.NotificationID)
	if err != nil {
		http.Error(w, "Notification not found", http.StatusNotFound)
		return
	}

	if notification.UserID != int64(userID) {
		http.Error(w, "Forbidden: You can only act on your own notifications", http.StatusForbidden)
		return
	}

	// Parse notification data
	var data map[string]interface{}
	if err := json.Unmarshal([]byte(notification.Data), &data); err != nil {
		http.Error(w, "Invalid notification data", http.StatusBadRequest)
		return
	}

	// Handle different notification types
	switch notification.Type {
	case "follow_request":
		err = handleFollowRequestAccept(data, int64(userID))
	case "group_request", "group_join_request":
		err = handleGroupRequestAccept(data, int64(userID))
	case "group_invite":
		err = handleGroupInviteAccept(data, int64(userID))
	default:
		http.Error(w, "Cannot accept this type of notification", http.StatusBadRequest)
		return
	}

	if err != nil {
		http.Error(w, "Error processing request: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Mark notification as read and delete it
	if err := db.DBService.UpdateNotification(req.NotificationID, models.UpdateNotificationRequest{IsRead: true}); err != nil {
		fmt.Printf("[WARNING] Failed to mark notification as read: %v\n", err)
	}
	if err := db.DBService.DeleteNotification(req.NotificationID); err != nil {
		fmt.Printf("[WARNING] Failed to delete notification: %v\n", err)
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"response": "Request accepted"}`))
}

// DeclineNotificationHandler handles declining notifications
func DeclineNotificationHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		NotificationID int64 `json:"notification_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.NotificationID == 0 {
		http.Error(w, "Missing notification ID", http.StatusBadRequest)
		return
	}

	// Get notification
	notification, err := db.DBService.GetNotificationByID(req.NotificationID)
	if err != nil {
		http.Error(w, "Notification not found", http.StatusNotFound)
		return
	}

	if notification.UserID != int64(userID) {
		http.Error(w, "Forbidden: You can only act on your own notifications", http.StatusForbidden)
		return
	}

	// Parse notification data
	var data map[string]interface{}
	if err := json.Unmarshal([]byte(notification.Data), &data); err != nil {
		http.Error(w, "Invalid notification data", http.StatusBadRequest)
		return
	}

	// Handle different notification types
	switch notification.Type {
	case "follow_request":
		err = handleFollowRequestDecline(data, int64(userID))
	case "group_request", "group_join_request":
		err = handleGroupRequestDecline(data, int64(userID))
	case "group_invite":
		err = handleGroupInviteDecline(data, int64(userID))
	default:
		http.Error(w, "Cannot decline this type of notification", http.StatusBadRequest)
		return
	}

	if err != nil {
		http.Error(w, "Error processing request: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Mark notification as read and delete it
	if err := db.DBService.UpdateNotification(req.NotificationID, models.UpdateNotificationRequest{IsRead: true}); err != nil {
		fmt.Printf("[WARNING] Failed to mark notification as read: %v\n", err)
	}
	if err := db.DBService.DeleteNotification(req.NotificationID); err != nil {
		fmt.Printf("[WARNING] Failed to delete notification: %v\n", err)
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"response": "Request declined"}`))
}

// Helper functions for handling different notification types
func handleFollowRequestAccept(data map[string]interface{}, userID int64) error {
	requesterID, ok := data["requester_id"].(float64)
	if !ok {
		return fmt.Errorf("invalid requester_id")
	}

	// Check if follow request still exists
	followReq, err := db.DBService.GetFollowRequestBetween(int64(requesterID), userID)
	if err != nil {
		return fmt.Errorf("follow request no longer exists")
	}

	if followReq.Status != "pending" {
		return fmt.Errorf("follow request is no longer pending")
	}

	// Update follow request status
	if err := db.DBService.UpdateFollowRequestStatus(followReq.ID, "accepted"); err != nil {
		return err
	}

	// Update follower counts
	_ = db.DBService.IncrementFollowersCount(userID)
	_ = db.DBService.IncrementFollowingCount(int64(requesterID))

	// Create notification for requester
	targetUser, err := db.DBService.GetUserByID(userID)
	if err == nil {
		avatar := ""
		if targetUser.Avatar.Valid {
			avatar = targetUser.Avatar.String
		}
		notificationData := fmt.Sprintf(`{"target_id": %d, "target_nickname": "%s", "target_avatar": "%s", "type": "follow_accepted"}`,
			userID, targetUser.Nickname, avatar)
		notificationReq := models.CreateNotificationRequest{
			UserID: int64(requesterID),
			Type:   "follow_accepted",
			Data:   notificationData,
		}
		if err := db.DBService.CreateNotification(notificationReq); err != nil {
			fmt.Printf("[WARNING] Failed to create follow accepted notification: %v\n", err)
		}
	}

	return nil
}

func handleFollowRequestDecline(data map[string]interface{}, userID int64) error {
	requesterID, ok := data["requester_id"].(float64)
	if !ok {
		return fmt.Errorf("invalid requester_id")
	}

	// Check if follow request still exists
	followReq, err := db.DBService.GetFollowRequestBetween(int64(requesterID), userID)
	if err != nil {
		return fmt.Errorf("follow request no longer exists")
	}

	if followReq.Status != "pending" {
		return fmt.Errorf("follow request is no longer pending")
	}

	// Delete the follow request entirely to allow future requests
	return db.DBService.DeleteFollowRequest(followReq.ID)
}

func handleGroupRequestAccept(data map[string]interface{}, userID int64) error {
	groupID, ok := data["group_id"].(float64)
	if !ok {
		return fmt.Errorf("invalid group_id")
	}
	requesterID, ok := data["requester_id"].(float64)
	if !ok {
		return fmt.Errorf("invalid requester_id")
	}

	// Check if group request still exists
	groupReq, err := db.DBService.GetGroupRequestByGroupAndUser(int64(groupID), int64(requesterID))
	if err != nil {
		return fmt.Errorf("group request no longer exists")
	}

	if groupReq.Status != "pending" {
		return fmt.Errorf("group request is no longer pending")
	}

	// Update group request status
	if err := db.DBService.UpdateGroupRequestStatus(groupReq.ID, "accepted"); err != nil {
		return err
	}

	// Add user to group
	groupMemberReq := models.GroupMember{
		GroupID: int64(groupID),
		UserID:  int64(requesterID),
		Role:    "member",
	}
	return db.DBService.CreateGroupMember(groupMemberReq)
}

func handleGroupRequestDecline(data map[string]interface{}, userID int64) error {
	groupID, ok := data["group_id"].(float64)
	if !ok {
		return fmt.Errorf("invalid group_id")
	}
	requesterID, ok := data["requester_id"].(float64)
	if !ok {
		return fmt.Errorf("invalid requester_id")
	}

	// Check if group request still exists
	groupReq, err := db.DBService.GetGroupRequestByGroupAndUser(int64(groupID), int64(requesterID))
	if err != nil {
		return fmt.Errorf("group request no longer exists")
	}

	if groupReq.Status != "pending" {
		return fmt.Errorf("group request is no longer pending")
	}

	// Delete the group request entirely to allow future requests
	return db.DBService.DeleteGroupRequest(groupReq.ID)
}

func handleGroupInviteAccept(data map[string]interface{}, userID int64) error {
	groupID, ok := data["group_id"].(float64)
	if !ok {
		return fmt.Errorf("invalid group_id")
	}

	// Check if group invitation still exists
	invitation, err := db.DBService.GetPendingGroupInvitation(int64(groupID), userID)
	if err != nil || invitation == nil {
		return fmt.Errorf("group invitation no longer exists")
	}

	if invitation.Status != "pending" {
		return fmt.Errorf("group invitation is no longer pending")
	}

	// Update invitation status
	if err := db.DBService.UpdateGroupInvitationStatus(invitation.ID, "accepted"); err != nil {
		return err
	}

	// Add user to group
	groupMemberReq := models.GroupMember{
		GroupID: int64(groupID),
		UserID:  userID,
		Role:    "member",
	}
	return db.DBService.CreateGroupMember(groupMemberReq)
}

func handleGroupInviteDecline(data map[string]interface{}, userID int64) error {
	groupID, ok := data["group_id"].(float64)
	if !ok {
		return fmt.Errorf("invalid group_id")
	}

	// Check if group invitation still exists
	invitation, err := db.DBService.GetPendingGroupInvitation(int64(groupID), userID)
	if err != nil || invitation == nil {
		return fmt.Errorf("group invitation no longer exists")
	}

	if invitation.Status != "pending" {
		return fmt.Errorf("group invitation is no longer pending")
	}

	// Delete the invitation entirely to allow future invitations
	return db.DBService.DeleteGroupInvitation(invitation.ID)
}
