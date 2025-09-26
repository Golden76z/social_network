package api

import (
	"encoding/json"
	"fmt"
	"log"
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
	userIDValue := r.Context().Value(middleware.UserIDKey)
	if userIDValue == nil {
		http.Error(w, "User not authenticated", http.StatusUnauthorized)
		return
	}

	userID, ok := userIDValue.(int)
	if !ok {
		http.Error(w, "Invalid user ID in context", http.StatusInternalServerError)
		return
	}

	log.Printf("GetConversationsHandler: Getting conversations for user %d", userID)
	conversations, err := db.DBService.GetConversations(userID)
	if err != nil {
		log.Printf("GetConversationsHandler: Error getting conversations: %v", err)
		http.Error(w, "Failed to get conversations", http.StatusInternalServerError)
		return
	}

	log.Printf("GetConversationsHandler: Found %d conversations", len(conversations))
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(conversations)
}

func GetMessagesHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(int)

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
	limit := 20 // default
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

	log.Printf("GetMessagesHandler: Getting messages between user %d and %d", userID, otherUserID)
	messages, err := db.DBService.GetMessagesBetweenUsers(userID, int(otherUserID), limit, offset)
	if err != nil {
		log.Printf("GetMessagesHandler: Error getting messages: %v", err)
		http.Error(w, "Failed to get messages", http.StatusInternalServerError)
		return
	}

	log.Printf("GetMessagesHandler: Found %d messages", len(messages))
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(messages)
}

func SendMessageHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(int)

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
	canSend, err := db.DBService.CheckCanSendMessage(userID, int(req.ReceiverID))
	if err != nil {
		http.Error(w, "Failed to validate message permissions", http.StatusInternalServerError)
		return
	}

	if !canSend {
		http.Error(w, "You cannot send messages to this user", http.StatusForbidden)
		return
	}

	// Create the message
	messageID, err := db.DBService.CreatePrivateMessage(userID, int(req.ReceiverID), req.Body)
	if err != nil {
		http.Error(w, "Failed to send message", http.StatusInternalServerError)
		return
	}

	// Send real-time notification via websocket
	hub := websockets.GetHub()
	if hub != nil {
		message := websockets.Message{
			Type:      websockets.MessageTypePrivateMessage,
			Content:   req.Body,
			UserID:    int(userID),
			Username:  r.Context().Value(middleware.UsernameKey).(string),
			Timestamp: time.Now(),
			MessageID: messageID,
			Data: map[string]interface{}{
				"sender_id":   userID,
				"receiver_id": req.ReceiverID,
			},
		}
		hub.BroadcastToUser(int(req.ReceiverID), message)

		update := websockets.Message{
			Type:      websockets.MessageTypeConversationUpdate,
			Timestamp: time.Now(),
			Data: map[string]any{
				"conversation_type": "private",
				"user_id":           userID,
				"last_message":      req.Body,
				"last_message_time": time.Now(),
			},
		}
		hub.BroadcastToUser(int(req.ReceiverID), update)
		hub.BroadcastToUser(userID, update)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

func GetGroupMessagesHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(int)

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
	isMember, err := db.DBService.CheckGroupMembership(userID, int(groupID))
	if err != nil {
		http.Error(w, "Failed to check group membership", http.StatusInternalServerError)
		return
	}

	if !isMember {
		http.Error(w, "You are not a member of this group", http.StatusForbidden)
		return
	}

	limitStr := r.URL.Query().Get("limit")
	limit := 20 // default
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

	messages, err := db.DBService.GetGroupMessagesWithUser(int(groupID), limit, offset)
	if err != nil {
		http.Error(w, "Failed to get group messages", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(messages)
}

func SendGroupMessageHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(int)

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
	isMember, err := db.DBService.CheckGroupMembership(userID, int(req.GroupID))
	if err != nil {
		http.Error(w, "Failed to check group membership", http.StatusInternalServerError)
		return
	}

	if !isMember {
		http.Error(w, "You are not a member of this group", http.StatusForbidden)
		return
	}

	// Create the group message
	messageID, err := db.DBService.CreateGroupMessage(int(req.GroupID), userID, req.Body)
	if err != nil {
		http.Error(w, "Failed to send group message", http.StatusInternalServerError)
		return
	}

	// Send real-time notification via websocket
	hub := websockets.GetHub()
	if hub != nil {
		message := websockets.Message{
			Type:      websockets.MessageTypeGroupMessage,
			Content:   req.Body,
			GroupID:   fmt.Sprintf("%d", req.GroupID),
			UserID:    int(userID),
			Username:  r.Context().Value(middleware.UsernameKey).(string),
			Timestamp: time.Now(),
			MessageID: messageID,
		}
		hub.BroadcastMessage(message)

		update := websockets.Message{
			Type:      websockets.MessageTypeConversationUpdate,
			GroupID:   fmt.Sprintf("%d", req.GroupID),
			Timestamp: time.Now(),
			Data: map[string]any{
				"conversation_type": "group",
				"group_id":          req.GroupID,
				"last_message":      req.Body,
				"last_message_time": time.Now(),
			},
		}
		hub.BroadcastMessage(update)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

func GetGroupConversationsHandler(w http.ResponseWriter, r *http.Request) {
	userIDValue := r.Context().Value(middleware.UserIDKey)
	if userIDValue == nil {
		http.Error(w, "User not authenticated", http.StatusUnauthorized)
		return
	}

	userID, ok := userIDValue.(int)
	if !ok {
		http.Error(w, "Invalid user ID in context", http.StatusInternalServerError)
		return
	}

	// Get group conversations for the user
	conversations, err := db.DBService.GetGroupConversations(userID)
	if err != nil {
		http.Error(w, "Failed to get group conversations", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(conversations)
}

func GetMessageableUsersHandler(w http.ResponseWriter, r *http.Request) {
	userIDValue := r.Context().Value(middleware.UserIDKey)
	if userIDValue == nil {
		http.Error(w, "User not authenticated", http.StatusUnauthorized)
		return
	}

	userID, ok := userIDValue.(int)
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
