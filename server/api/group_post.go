package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/Golden76z/social-network/db"
	"github.com/Golden76z/social-network/middleware"
	"github.com/Golden76z/social-network/models"
	"github.com/Golden76z/social-network/utils"
)

func CreateGroupPostHandler(w http.ResponseWriter, r *http.Request) {
	// Get current user ID from context (injected by AuthMiddleware)
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Converting the JSON sent by client-side to struct
	var req models.CreateGroupPostRequest
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

	// Checking if the group id is valid

	// Checking if the user can make a post in this group

	// Calling the Database to create the new Group's Post
	errDB := db.DBService.CreateGroupPost(req, int64(userID))
	if errDB != nil {
		http.Error(w, "Error creating the group post", http.StatusInternalServerError)
		return
	}

	// Send back a response to the client-side in case of success
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"response": "Group Post successfully created"}`))
}

func GetGroupPostHandler(w http.ResponseWriter, r *http.Request) {
	// Get current user ID from context (injected by AuthMiddleware)
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Getting the information on the URL
	query := r.URL.Query()

	// Getting either the id or offlimit
	idStr := query.Get("id")
	offsetStr := query.Get("offlimit")

	w.Header().Set("Content-Type", "application/json")

	// Case 1: ID is present — get a single post as array
	if idStr != "" {
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			http.Error(w, "Invalid id parameter", http.StatusBadRequest)
			return
		}

		post, err := db.DBService.GetGroupPostsWithImagesByGroupID(id)
		if err != nil {
			http.Error(w, "Post not found", http.StatusNotFound)
			return
		}

		json.NewEncoder(w).Encode([]*models.GroupPost{post})
		return
	}

	// Case 2: offlimit is present — get paginated posts
	if offsetStr != "" {
		offset, err := strconv.Atoi(offsetStr)
		if err != nil {
			http.Error(w, "Invalid offlimit parameter", http.StatusBadRequest)
			return
		}

		posts, err := db.DBService.GetGroupPostsWithImagesPaginated(offset)
		if err != nil {
			http.Error(w, "Failed to fetch posts", http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(posts)
		return
	}

	// Case 3: neither id nor offlimit provided — return error
	http.Error(w, "Missing id or offlimit query parameter", http.StatusBadRequest)
}

func UpdateGroupPostHandler(w http.ResponseWriter, r *http.Request) {
	// Get current user ID from context (injected by AuthMiddleware)
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Converting the JSON sent by client-side to struct
	var req models.UpdateGroupPostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate that post ID is provided
	if req.ID == 0 {
		http.Error(w, "Post ID is required", http.StatusBadRequest)
		return
	}

	// Validate request fields if they are provided
	if req.Title != nil && len(*req.Title) < 3 {
		http.Error(w, "Title must be at least 3 characters long", http.StatusBadRequest)
		return
	}
	if req.Body != nil && len(*req.Body) < 3 {
		http.Error(w, "Body must be at least 3 characters long", http.StatusBadRequest)
		return
	}

	// Check if the post exists and belongs to the user
	existingPost, err := db.DBService.GetGroupPostWithImagesByID(req.ID)
	if err != nil {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	// Check if the user is authorized to update this post
	if existingPost.UserID != int64(userID) {
		http.Error(w, "Forbidden: You can only update your own posts", http.StatusForbidden)
		return
	}

	// Update the group post in database
	if err := db.DBService.UpdateGroupPost(req.ID, req); err != nil {
		http.Error(w, "Error updating the group post", http.StatusInternalServerError)
		return
	}

	// Send back a response to the client-side in case of success
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"response": "Group Post successfully updated"}`))
}

func DeleteGroupPostHandler(w http.ResponseWriter, r *http.Request) {
	// Get current user ID from context (injected by AuthMiddleware)
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Converting the JSON sent by client-side to struct
	var req models.DeleteGroupPostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate that post ID is provided
	if req.ID == 0 {
		http.Error(w, "Post ID is required", http.StatusBadRequest)
		return
	}

	// Check if the post exists and belongs to the user
	existingPost, err := db.DBService.GetGroupPostWithImagesByID(req.ID)
	if err != nil {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	// Check if the user is authorized to delete this post
	if existingPost.UserID != int64(userID) {
		http.Error(w, "Forbidden: You can only delete your own posts", http.StatusForbidden)
		return
	}

	// Delete the group post from database
	if err := db.DBService.DeleteGroupPost(req.ID); err != nil {
		http.Error(w, "Error deleting the group post", http.StatusInternalServerError)
		return
	}

	// Send back a response to the client-side in case of success
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"response": "Group Post successfully deleted"}`))
}
