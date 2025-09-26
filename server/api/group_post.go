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

	// Validate images if provided
	if len(req.Images) > 4 {
		http.Error(w, "Maximum 4 images allowed per post", http.StatusBadRequest)
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

// GetGroupPostHandler retrieves group posts - handles both list and individual post requests
func GetGroupPostHandler(w http.ResponseWriter, r *http.Request) {
	// Retrieve the current user ID from the request context (set by AuthMiddleware)
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	// Check if this is a request for a specific post (has path parameter)
	path := strings.TrimPrefix(r.URL.Path, "/api/group/post")
	if path != "" && path != "/" {
		// This is a request for a specific post: /api/group/post/{id}
		postIDStr := strings.Trim(path, "/")
		postID, err := strconv.ParseInt(postIDStr, 10, 64)
		if err != nil {
			http.Error(w, "Invalid post ID", http.StatusBadRequest)
			return
		}

		// Get specific group post
		post, err := db.DBService.GetGroupPostWithImagesByID(postID, int64(userID))
		if err != nil {
			if err.Error() == "post not found" {
				http.Error(w, "Post not found", http.StatusNotFound)
				return
			}
			if err.Error() == "user is not a member of the group" {
				http.Error(w, "Access denied: Not a group member", http.StatusForbidden)
				return
			}
			http.Error(w, "Error retrieving post: "+err.Error(), http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(post)
		return
	}

	// This is a request for list of posts: /api/group/post?groupId=1&offset=0
	query := r.URL.Query()
	offsetStr := query.Get("offset")
	groupidStr := query.Get("groupId")

	if groupidStr == "" {
		http.Error(w, "Missing groupId query parameter", http.StatusBadRequest)
		return
	}

	// Convert offset and groupID to int64
	var offSet int64 = 0 // Default offset
	var err error
	if offsetStr != "" {
		offSet, err = strconv.ParseInt(offsetStr, 10, 64)
		if err != nil {
			http.Error(w, "Invalid offset parameter", http.StatusBadRequest)
			return
		}
	}

	groupID, errGroupID := strconv.ParseInt(groupidStr, 10, 64)
	if errGroupID != nil {
		http.Error(w, "Invalid groupId parameter", http.StatusBadRequest)
		return
	}

	// Log the parameters for debugging
	fmt.Println("Sending parameters: ", offSet, groupID)

	// Retrieve the list of group posts with images
	posts, err := db.DBService.GetGroupPostsWithImagesByGroupID(groupID, int(offSet), int64(userID))
	if err != nil {
		if err.Error() == "group does not exist" {
			http.Error(w, "Group not found", http.StatusNotFound)
			return
		}
		if err.Error() == "user is not a member of the group" {
			http.Error(w, "Access denied: Not a group member", http.StatusForbidden)
			return
		}
		http.Error(w, "Error retrieving posts: "+err.Error(), http.StatusInternalServerError)
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

	// Check if this is a path-based update: /api/group/post/{id}
	path := strings.TrimPrefix(r.URL.Path, "/api/group/post")
	var postID int64
	var err error

	if path != "" && path != "/" {
		// Path-based: /api/group/post/{id}
		postIDStr := strings.Trim(path, "/")
		postID, err = strconv.ParseInt(postIDStr, 10, 64)
		if err != nil {
			http.Error(w, "Invalid post ID", http.StatusBadRequest)
			return
		}
	} else {
		// Body-based: decode request body for ID
		var req models.UpdateGroupPostRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		postID = req.ID
		if postID == 0 {
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

		// Update the group post in the database
		if err := db.DBService.UpdateGroupPost(req, int64(userID)); err != nil {
			if err.Error() == "not authorized" {
				http.Error(w, "Forbidden: You can only update your own posts", http.StatusForbidden)
				return
			}
			http.Error(w, "Error updating the group post", http.StatusInternalServerError)
			return
		}

		// Respond with success
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"response": "Group Post successfully updated"}`))
		return
	}

	// For path-based updates, we need to decode the body for the update data
	// Since your frontend sends data with id, we need to handle this case
	var updateData map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updateData); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Create UpdateGroupPostRequest from the data
	req := models.UpdateGroupPostRequest{ID: postID}

	if title, ok := updateData["title"].(string); ok {
		req.Title = &title
	}
	if body, ok := updateData["body"].(string); ok {
		req.Body = &body
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

	// Update the group post in the database
	if err := db.DBService.UpdateGroupPost(req, int64(userID)); err != nil {
		if err.Error() == "not authorized" {
			http.Error(w, "Forbidden: You can only update your own posts", http.StatusForbidden)
			return
		}
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

	// Check if this is a path-based delete: /api/group/post/{id}
	path := strings.TrimPrefix(r.URL.Path, "/api/group/post")
	var postID int64
	var err error

	if path != "" && path != "/" {
		// Path-based: /api/group/post/{id}
		postIDStr := strings.Trim(path, "/")
		postID, err = strconv.ParseInt(postIDStr, 10, 64)
		if err != nil {
			http.Error(w, "Invalid post ID", http.StatusBadRequest)
			return
		}
	} else {
		// Body-based: decode request body for ID
		var req models.DeleteGroupPostRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		postID = req.ID
		if postID == 0 {
			http.Error(w, "Post ID is required", http.StatusBadRequest)
			return
		}
	}

	// Check if the post exists and belongs to the user
	existingPost, err := db.DBService.GetGroupPostWithImagesByID(postID, int64(userID))
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
	if err := db.DBService.DeleteGroupPost(postID, int64(userID)); err != nil {
		http.Error(w, "Error deleting the group post", http.StatusInternalServerError)
		return
	}

	// Respond with success
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"response": "Group Post successfully deleted"}`))
}
