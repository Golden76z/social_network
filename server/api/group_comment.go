package api

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/Golden76z/social-network/db"
	"github.com/Golden76z/social-network/middleware"
	"github.com/Golden76z/social-network/models"
	"github.com/Golden76z/social-network/utils"
)

func CreateGroupCommentHandler(w http.ResponseWriter, r *http.Request) {
	// Get current user ID from context (injected by AuthMiddleware)
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Converting the JSON sent by client-side to struct
	var req models.CreateGroupCommentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request fields
	if validationErrors := utils.ValidateStringLength(&req, 3, 100); len(validationErrors) > 0 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(validationErrors)
		return
	}

	// Calling the Database to create the new Group's Comment
	errDB := db.DBService.CreateGroupComment(req, int64(userID))
	if errDB != nil {
		http.Error(w, "Error creating the group comment", http.StatusInternalServerError)
		return
	}

	// Send back a response to the client-side in case of success
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"response": "Group Comment successfully created"}`))
}

func GetGroupCommentHandler(w http.ResponseWriter, r *http.Request) {
	// Get current user ID from context (injected by AuthMiddleware)
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Extract group_post_id from URL path or query parameters
	// Assuming URL structure like: /api/group-comments?group_post_id=123
	groupPostIDStr := r.URL.Query().Get("group_post_id")
	if groupPostIDStr == "" {
		http.Error(w, "group_post_id parameter is required", http.StatusBadRequest)
		return
	}

	groupPostID, err := strconv.ParseInt(groupPostIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid group_post_id parameter", http.StatusBadRequest)
		return
	}

	// Get comments from database
	comments, errDB := db.DBService.GetGroupComments(groupPostID, int64(userID))
	if errDB != nil {
		http.Error(w, "Error retrieving group comments", http.StatusInternalServerError)
		return
	}

	// Set content type and encode response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(comments)
}

func UpdateGroupCommentHandler(w http.ResponseWriter, r *http.Request) {
	// Get current user ID from context (injected by AuthMiddleware)
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Extract comment ID from URL path
	// Assuming URL structure like: /api/group-comments/123
	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 2 {
		http.Error(w, "Comment ID is required in URL path", http.StatusBadRequest)
		return
	}

	commentID, err := strconv.ParseInt(pathParts[len(pathParts)-1], 10, 64)
	if err != nil {
		http.Error(w, "Invalid comment ID", http.StatusBadRequest)
		return
	}

	// Parse request body
	var req models.UpdateGroupCommentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request fields
	if validationErrors := utils.ValidateStringLength(&req, 3, 100); len(validationErrors) > 0 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(validationErrors)
		return
	}

	// Update comment in database
	errDB := db.DBService.UpdateGroupComment(commentID, int64(userID), req)
	if errDB != nil {
		if errDB.Error() == "comment not found" || errDB.Error() == "unauthorized" {
			http.Error(w, "Comment not found or unauthorized", http.StatusNotFound)
			return
		}
		http.Error(w, "Error updating group comment", http.StatusInternalServerError)
		return
	}

	// Send success response
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"response": "Group Comment successfully updated"}`))
}

func DeleteGroupCommentHandler(w http.ResponseWriter, r *http.Request) {
	// Get current user ID from context (injected by AuthMiddleware)
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Converting the JSON sent by client-side to struct
	var req models.DeleteGroupCommentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Delete comment from database
	errDB := db.DBService.DeleteGroupComment(req.ID, int64(userID))
	if errDB != nil {
		if errDB.Error() == "comment not found" || errDB.Error() == "unauthorized" {
			http.Error(w, "Comment not found or unauthorized", http.StatusNotFound)
			return
		}
		http.Error(w, "Error deleting group comment", http.StatusInternalServerError)
		return
	}

	// Send success response
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"response": "Group Comment successfully deleted"}`))
}
