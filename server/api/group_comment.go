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

	// Getting the information on the URL
	query := r.URL.Query()

	// Getting the offlimit from the url
	offsetStr := query.Get("offset")
	groupPostIDStr := query.Get("id")

	// Converting offSet and groupID to int's
	offSet, errOffSet := strconv.ParseInt(offsetStr, 10, 64)
	groupPostID, errGroupID := strconv.ParseInt(groupPostIDStr, 10, 64)
	if errOffSet != nil || errGroupID != nil {
		http.Error(w, "Missing id or offlimit query parameter", http.StatusBadRequest)
		return
	}

	// Get comments from database
	comments, errDB := db.DBService.GetGroupComments(groupPostID, int64(userID), int(offSet))
	if errDB != nil {
		fmt.Println("Error db: ", errDB)
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
	errDB := db.DBService.UpdateGroupComment(req.ID, int64(userID), req)
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
