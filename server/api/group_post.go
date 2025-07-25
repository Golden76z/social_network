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

// CreateGroupPostHandler handles the creation of a new group post.
func CreateGroupPostHandler(w http.ResponseWriter, r *http.Request) {
	// Retrieve the current user ID from the request context (set by AuthMiddleware)
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Decode the JSON request body into the CreateGroupPostRequest struct
	var req models.CreateGroupPostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate the title and body length (between 3 and 100 characters)
	if validationErrors := utils.ValidateStringLength(&req, 3, 100); len(validationErrors) > 0 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(validationErrors)
		return
	}

	// Create the group post in the database
	errDB := db.DBService.CreateGroupPost(req, int64(userID))
	if errDB != nil {
		http.Error(w, "Error creating the group post", http.StatusInternalServerError)
		return
	}

	// Respond with success
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"response": "Group Post successfully created"}`))
}

// GetGroupPostHandler retrieves a list of group posts for a given group, with pagination support.
func GetGroupPostHandler(w http.ResponseWriter, r *http.Request) {
	// Retrieve the current user ID from the request context (set by AuthMiddleware)
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse query parameters for pagination and group ID
	query := r.URL.Query()
	offsetStr := query.Get("offlimit")
	groupidStr := query.Get("groupID")

	w.Header().Set("Content-Type", "application/json")

	// Convert offset and groupID to int64
	offSet, errOffSet := strconv.ParseInt(offsetStr, 10, 64)
	groupID, errGroupID := strconv.ParseInt(groupidStr, 10, 64)
	if errOffSet != nil || errGroupID != nil {
		http.Error(w, "Missing id or offlimit query parameter", http.StatusBadRequest)
		return
	}

	// Log the parameters for debugging
	fmt.Println("Sending parameters: ", offSet, groupID)

	// Retrieve the list of group posts with images
	posts, err := db.DBService.GetGroupPostsWithImagesByGroupID(groupID, int(offSet), int64(userID))
	if err != nil {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	// Respond with the array of posts
	json.NewEncoder(w).Encode(posts)
}

// UpdateGroupPostHandler handles updating an existing group post.
func UpdateGroupPostHandler(w http.ResponseWriter, r *http.Request) {
	// Retrieve the current user ID from the request context (set by AuthMiddleware)
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Decode the JSON request body into the UpdateGroupPostRequest struct
	var req models.UpdateGroupPostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Ensure the post ID is provided
	if req.ID == 0 {
		http.Error(w, "Post ID is required", http.StatusBadRequest)
		return
	}

	// Validate the title and body if provided
	if req.Title != nil && len(*req.Title) < 3 {
		http.Error(w, "Title must be at least 3 characters long", http.StatusBadRequest)
		return
	}
	if req.Body != nil && len(*req.Body) < 3 {
		http.Error(w, "Body must be at least 3 characters long", http.StatusBadRequest)
		return
	}

	// Check if the post exists and belongs to the user
	existingPost, err := db.DBService.GetGroupPostWithImagesByID(req.ID, int64(userID))
	if err != nil {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	// Only the owner can update their post
	if existingPost.UserID != int64(userID) {
		http.Error(w, "Forbidden: You can only update your own posts", http.StatusForbidden)
		return
	}

	// Update the group post in the database
	if err := db.DBService.UpdateGroupPost(req, int64(userID)); err != nil {
		http.Error(w, "Error updating the group post", http.StatusInternalServerError)
		return
	}

	// Respond with success
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"response": "Group Post successfully updated"}`))
}

// DeleteGroupPostHandler handles the deletion of a group post by its owner.
func DeleteGroupPostHandler(w http.ResponseWriter, r *http.Request) {
	// Retrieve the current user ID from the request context (set by AuthMiddleware)
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Decode the JSON request body into the DeleteGroupPostRequest struct
	var req models.DeleteGroupPostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Ensure the post ID is provided
	if req.ID == 0 {
		http.Error(w, "Post ID is required", http.StatusBadRequest)
		return
	}

	// Check if the post exists and belongs to the user
	existingPost, err := db.DBService.GetGroupPostWithImagesByID(req.ID, int64(userID))
	if err != nil {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	// Only the owner can delete their post
	if existingPost.UserID != int64(userID) {
		http.Error(w, "Forbidden: You can only delete your own posts", http.StatusForbidden)
		return
	}

	// Delete the group post from the database
	if err := db.DBService.DeleteGroupPost(req.ID, int64(userID)); err != nil {
		http.Error(w, "Error deleting the group post", http.StatusInternalServerError)
		return
	}

	// Respond with success
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"response": "Group Post successfully deleted"}`))
}
