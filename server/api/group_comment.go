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

	// Support two cases:
	// - /api/group/comment?postId=...&offset=...
	// - /api/group/comment/{id}
	query := r.URL.Query()
	if idPath := utils.GetPathParam(r, "id"); idPath != "" {
		// Single comment by ID
		commentID, err := strconv.ParseInt(idPath, 10, 64)
		if err != nil || commentID <= 0 {
			http.Error(w, "Invalid comment ID", http.StatusBadRequest)
			return
		}
		comment, err := db.DBService.GetGroupCommentWithUserDetails(commentID, int64(userID))
		if err != nil {
			if err.Error() == "comment not found or access denied" {
				http.Error(w, "Comment not found", http.StatusNotFound)
				return
			}
			http.Error(w, "Error retrieving comment", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(comment)
		return
	}

	// List comments for a post
	offsetStr := query.Get("offset")
	postIDStr := query.Get("postId")

	var offSet int64 = 0
	var err error
	if offsetStr != "" {
		offSet, err = strconv.ParseInt(offsetStr, 10, 64)
		if err != nil {
			http.Error(w, "Invalid offset", http.StatusBadRequest)
			return
		}
	}
	postID, err := strconv.ParseInt(postIDStr, 10, 64)
	if err != nil || postID <= 0 {
		http.Error(w, "Missing or invalid postId", http.StatusBadRequest)
		return
	}

	comments, errDB := db.DBService.GetGroupComments(postID, int64(userID), int(offSet))
	if errDB != nil {
		fmt.Println("Error db: ", errDB)
		http.Error(w, "Error retrieving group comments", http.StatusInternalServerError)
		return
	}

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

	// Allow path-based id
	if req.ID == 0 {
		if idPath := utils.GetPathParam(r, "id"); idPath != "" {
			if idNum, err := strconv.ParseInt(idPath, 10, 64); err == nil {
				req.ID = idNum
			}
		}
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

	// Support body or path id
	var req models.DeleteGroupCommentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		// ignore body error; try path
	}
	if req.ID == 0 {
		if idPath := utils.GetPathParam(r, "id"); idPath != "" {
			if idNum, err := strconv.ParseInt(idPath, 10, 64); err == nil {
				req.ID = idNum
			}
		}
	}
	if req.ID == 0 {
		http.Error(w, "Comment ID is required", http.StatusBadRequest)
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
