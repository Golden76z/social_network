package api

import (
	"encoding/json"
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
