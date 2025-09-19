package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/Golden76z/social-network/db"
	"github.com/Golden76z/social-network/middleware"
	"github.com/Golden76z/social-network/websockets"
)

type SendMessageRequest struct {
	ReceiverID int64  `json:"receiver_id"`
	Body       string `json:"body"`
}

type SendGroupMessageRequest struct {
	GroupID int64  `json:"group_id"`
	Body    string `json:"body"`
}

type GetMessagesRequest struct {
	UserID int64 `json:"user_id"`
	Limit  int   `json:"limit"`
	Offset int   `json:"offset"`
}

type GetGroupMessagesRequest struct {
	GroupID int64 `json:"group_id"`
	Limit   int   `json:"limit"`
	Offset  int   `json:"offset"`
}

func GetConversationsHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("GetConversationsHandler: Handler called!\n")
	// Debug: Check if userID is in context
	userIDValue := r.Context().Value(middleware.UserIDKey)
	if userIDValue == nil {
		http.Error(w, "User not authenticated", http.StatusUnauthorized)
		return
	}

	fmt.Printf("GetConversationsHandler: userIDValue type: %T, value: %v\n", userIDValue, userIDValue)
	userID, ok := userIDValue.(int64)
	if !ok {
		fmt.Printf("GetConversationsHandler: Type assertion failed, got type: %T\n", userIDValue)
		http.Error(w, "Invalid user ID in context", http.StatusInternalServerError)
		return
	}

	conversations, err := db.DBService.GetConversations(userID)
	if err != nil {
		http.Error(w, "Failed to get conversations", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(conversations)
}

func GetMessagesHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(int64)

	// Parse query parameters
	otherUserIDStr := r.URL.Query().Get("user_id")
	if otherUserIDStr == "" {
		http.Error(w, "user_id parameter is required", http.StatusBadRequest)
		return
	}

	otherUserID, err := strconv.ParseInt(otherUserIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid user_id", http.StatusBadRequest)
		return
	}

	limitStr := r.URL.Query().Get("limit")
	limit := 50 // default
	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			limit = parsedLimit
		}
	}

	offsetStr := r.URL.Query().Get("offset")
	offset := 0 // default
	if offsetStr != "" {
		if parsedOffset, err := strconv.Atoi(offsetStr); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	messages, err := db.DBService.GetMessagesBetweenUsers(userID, otherUserID, limit, offset)
	if err != nil {
		http.Error(w, "Failed to get messages", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(messages)
}

func SendMessageHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(int64)

	var req SendMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request
	if req.ReceiverID <= 0 {
		http.Error(w, "Invalid receiver_id", http.StatusBadRequest)
		return
	}

	if req.Body == "" || len(req.Body) > 1000 {
		http.Error(w, "Message body must be between 1 and 1000 characters", http.StatusBadRequest)
		return
	}

	// Check if user can send message to this receiver
	canSend, err := db.DBService.CheckCanSendMessage(userID, req.ReceiverID)
	if err != nil {
		http.Error(w, "Failed to validate message permissions", http.StatusInternalServerError)
		return
	}

	if !canSend {
		http.Error(w, "You cannot send messages to this user", http.StatusForbidden)
		return
	}

	// Create the message
	err = db.DBService.CreatePrivateMessage(userID, req.ReceiverID, req.Body)
	if err != nil {
		http.Error(w, "Failed to send message", http.StatusInternalServerError)
		return
	}

	// Send real-time notification via websocket
	hub := websockets.GetHub()
	if hub != nil {
		message := websockets.Message{
			Type:      "private_message",
			Content:   req.Body,
			UserID:    int(userID),
			Username:  r.Context().Value("username").(string),
			Timestamp: time.Now(),
			Data: map[string]interface{}{
				"receiver_id": req.ReceiverID,
			},
		}
		hub.BroadcastToUser(int(req.ReceiverID), message)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

func GetGroupMessagesHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(int64)

	// Parse query parameters
	groupIDStr := r.URL.Query().Get("group_id")
	if groupIDStr == "" {
		http.Error(w, "group_id parameter is required", http.StatusBadRequest)
		return
	}

	groupID, err := strconv.ParseInt(groupIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid group_id", http.StatusBadRequest)
		return
	}

	// Check if user is a member of the group
	isMember, err := db.DBService.CheckGroupMembership(userID, groupID)
	if err != nil {
		http.Error(w, "Failed to check group membership", http.StatusInternalServerError)
		return
	}

	if !isMember {
		http.Error(w, "You are not a member of this group", http.StatusForbidden)
		return
	}

	limitStr := r.URL.Query().Get("limit")
	limit := 50 // default
	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			limit = parsedLimit
		}
	}

	offsetStr := r.URL.Query().Get("offset")
	offset := 0 // default
	if offsetStr != "" {
		if parsedOffset, err := strconv.Atoi(offsetStr); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	messages, err := db.DBService.GetGroupMessages(groupID, limit, offset)
	if err != nil {
		http.Error(w, "Failed to get group messages", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(messages)
}

func SendGroupMessageHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(int64)

	var req SendGroupMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request
	if req.GroupID <= 0 {
		http.Error(w, "Invalid group_id", http.StatusBadRequest)
		return
	}

	if req.Body == "" || len(req.Body) > 1000 {
		http.Error(w, "Message body must be between 1 and 1000 characters", http.StatusBadRequest)
		return
	}

	// Check if user is a member of the group
	isMember, err := db.DBService.CheckGroupMembership(userID, req.GroupID)
	if err != nil {
		http.Error(w, "Failed to check group membership", http.StatusInternalServerError)
		return
	}

	if !isMember {
		http.Error(w, "You are not a member of this group", http.StatusForbidden)
		return
	}

	// Create the group message
	err = db.DBService.CreateGroupMessage(req.GroupID, userID, req.Body)
	if err != nil {
		http.Error(w, "Failed to send group message", http.StatusInternalServerError)
		return
	}

	// Send real-time notification via websocket
	hub := websockets.GetHub()
	if hub != nil {
		message := websockets.Message{
			Type:      "group_message",
			Content:   req.Body,
			GroupID:   fmt.Sprintf("%d", req.GroupID),
			UserID:    int(userID),
			Username:  r.Context().Value("username").(string),
			Timestamp: time.Now(),
		}
		hub.BroadcastMessage(message)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

func GetMessageableUsersHandler(w http.ResponseWriter, r *http.Request) {
	userIDValue := r.Context().Value(middleware.UserIDKey)
	if userIDValue == nil {
		http.Error(w, "User not authenticated", http.StatusUnauthorized)
		return
	}

	userID, ok := userIDValue.(int64)
	if !ok {
		http.Error(w, "Invalid user ID in context", http.StatusInternalServerError)
		return
	}

	// Get users that can be messaged (followers + following + public users)
	users, err := db.DBService.GetMessageableUsers(userID)
	if err != nil {
		http.Error(w, "Failed to get messageable users", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}
