package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/Golden76z/social-network/config"
	"github.com/Golden76z/social-network/db"
	"github.com/Golden76z/social-network/middleware"
	"github.com/Golden76z/social-network/models"
	"github.com/Golden76z/social-network/utils"
)

func CreatePostHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST method allowed", http.StatusMethodNotAllowed)
		return
	}

	currentUserID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if db.DBService.DB == nil {
		http.Error(w, "Database connection error", http.StatusInternalServerError)
		return
	}

	var createRequest models.CreatePostRequest
	err := json.NewDecoder(r.Body).Decode(&createRequest)
	if err != nil {
		http.Error(w, "Invalid JSON format", http.StatusBadRequest)
		return
	}

	cfg := config.GetConfig()

	createRequest.Title = utils.SanitizeString(createRequest.Title)
	if !utils.ValidatePostTitle(createRequest.Title, cfg.PostTitleMaxLength) {
		http.Error(w, fmt.Sprintf("Invalid title format. Max length: %d characters", cfg.PostTitleMaxLength), http.StatusBadRequest)
		return
	}

	createRequest.Body = utils.SanitizeString(createRequest.Body)
	if !utils.ValidatePostBody(createRequest.Body, cfg.PostContentMaxLength) {
		http.Error(w, fmt.Sprintf("Invalid body format. Max length: %d characters", cfg.PostContentMaxLength), http.StatusBadRequest)
		return
	}

	if !utils.ValidatePostImageCount(createRequest.Images, cfg.MaxImagesPerPost) {
		http.Error(w, fmt.Sprintf("Invalid number of images. Max: %d", cfg.MaxImagesPerPost), http.StatusBadRequest)
		return
	}

	if createRequest.Visibility != "public" && createRequest.Visibility != "private" {
		http.Error(w, "Invalid visibility setting. Use 'public' or 'private'", http.StatusBadRequest)
		return
	}

	postID, err := db.DBService.CreatePost(int64(currentUserID), createRequest)
	if err != nil {
		fmt.Printf("[API] Create post failed: %v\n", err)
		http.Error(w, "Failed to create post", http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"message": "Post created successfully",
		"postID":  postID,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

func GetPostHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Only GET method allowed", http.StatusMethodNotAllowed)
		return
	}

	// Try to get current user ID from context (may be nil for anonymous users)
	currentUserID, _ := r.Context().Value(middleware.UserIDKey).(int)
	var currentUserIDInt64 int64 = 0
	if currentUserID > 0 {
		currentUserIDInt64 = int64(currentUserID)
	}

	idParam := r.URL.Query().Get("id")

	if idParam != "" {
		postID, err := strconv.ParseInt(idParam, 10, 64)
		if err != nil {
			http.Error(w, "Invalid post ID format", http.StatusBadRequest)
			return
		}

		post, err := db.DBService.GetPostByID(postID, currentUserIDInt64)
		if err != nil {
			if err.Error() == "unauthorized" {
				http.Error(w, "You are not authorized to view this post", http.StatusForbidden)
				return
			}
			http.Error(w, "Post not found", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(post)
		return
	}

	// Check for specific query parameters
	userIdParam := r.URL.Query().Get("userId")
	meParam := r.URL.Query().Get("me")
	likedParam := r.URL.Query().Get("liked")
	commentedParam := r.URL.Query().Get("commented")

	var posts interface{}
	var err error

	if userIdParam != "" {
		// Get posts by specific user
		targetUserID, err := strconv.ParseInt(userIdParam, 10, 64)
		if err != nil {
			http.Error(w, "Invalid user ID format", http.StatusBadRequest)
			return
		}

		if likedParam == "true" {
			// Get posts liked by specific user
			posts, err = db.DBService.GetLikedPostsByUser(targetUserID, currentUserIDInt64)
		} else if commentedParam == "true" {
			// Get posts commented by specific user
			posts, err = db.DBService.GetCommentedPostsByUser(targetUserID, currentUserIDInt64)
		} else {
			// Get posts by specific user
			posts, err = db.DBService.GetPostsByUser(targetUserID, currentUserIDInt64)
		}
	} else if meParam == "true" {
		// Get current user's posts (requires authentication)
		if currentUserID == 0 {
			http.Error(w, "Authentication required", http.StatusUnauthorized)
			return
		}
		posts, err = db.DBService.GetPostsByUser(currentUserIDInt64, currentUserIDInt64)
	} else if likedParam == "true" {
		// Get posts liked by current user (requires authentication)
		if currentUserID == 0 {
			http.Error(w, "Authentication required", http.StatusUnauthorized)
			return
		}
		posts, err = db.DBService.GetLikedPosts(currentUserIDInt64, currentUserIDInt64)
	} else if commentedParam == "true" {
		// Get posts commented by current user (requires authentication)
		if currentUserID == 0 {
			http.Error(w, "Authentication required", http.StatusUnauthorized)
			return
		}
		posts, err = db.DBService.GetCommentedPosts(currentUserIDInt64, currentUserIDInt64)
	} else {
		// Default: get user feed (requires authentication)
		if currentUserID == 0 {
			http.Error(w, "Authentication required", http.StatusUnauthorized)
			return
		}
		limitParam := r.URL.Query().Get("limit")
		limit, err := strconv.Atoi(limitParam)
		cfg := config.GetConfig()
		if err != nil || limit <= 0 {
			limit = cfg.FeedPostLimit
		}

		offsetParam := r.URL.Query().Get("offset")
		offset, err := strconv.Atoi(offsetParam)
		if err != nil || offset < 0 {
			offset = 0
		}

		posts, err = db.DBService.GetUserFeed(currentUserID, limit, offset)
	}

	if err != nil {
		fmt.Printf("[API] Get posts failed: %v\n", err)
		http.Error(w, "Failed to get posts", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(posts)
}

func UpdatePostHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Only PUT method allowed", http.StatusMethodNotAllowed)
		return
	}

	currentUserID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	postIDStr := utils.GetPathParam(r, "id")
	postID, err := strconv.ParseInt(postIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid post ID", http.StatusBadRequest)
		return
	}

	var req models.UpdatePostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Verify ownership
	post, err := db.DBService.GetPostByID(postID, int64(currentUserID))
	if err != nil {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}
	if post.AuthorID != int64(currentUserID) {
		http.Error(w, "You are not authorized to edit this post", http.StatusForbidden)
		return
	}

	if err := db.DBService.UpdatePost(postID, req); err != nil {
		fmt.Printf("[API] Update post failed: %v\n", err)
		http.Error(w, "Failed to update post", http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"message": "Post updated successfully",
		"postID":  postID,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func DeletePostHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Only DELETE method allowed", http.StatusMethodNotAllowed)
		return
	}

	currentUserID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	postIDStr := utils.GetPathParam(r, "id")
	postID, err := strconv.ParseInt(postIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid post ID", http.StatusBadRequest)
		return
	}

	// Verify ownership before deleting
	post, err := db.DBService.GetPostByID(postID, int64(currentUserID))
	if err != nil {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}
	if post.AuthorID != int64(currentUserID) {
		http.Error(w, "You are not authorized to delete this post", http.StatusForbidden)
		return
	}

	// Delete the post and all associated data
	if err := db.DBService.DeletePost(postID); err != nil {
		fmt.Printf("[API] Delete post failed: %v\n", err)
		http.Error(w, "Failed to delete post", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Post deleted successfully"})
}

// GetPostVisibilityHandler returns who can see a specific private post
func GetPostVisibilityHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Only GET method allowed", http.StatusMethodNotAllowed)
		return
	}

	currentUserID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	postIDStr := utils.GetPathParam(r, "id")
	postID, err := strconv.ParseInt(postIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid post ID", http.StatusBadRequest)
		return
	}

	// Verify ownership
	post, err := db.DBService.GetPostByID(postID, int64(currentUserID))
	if err != nil {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}
	if post.AuthorID != int64(currentUserID) {
		http.Error(w, "You are not authorized to view this post's visibility settings", http.StatusForbidden)
		return
	}

	// Get visibility users
	userIDs, err := db.DBService.GetPostVisibilityUsers(postID)
	if err != nil {
		http.Error(w, "Error fetching post visibility", http.StatusInternalServerError)
		return
	}

	// Get user details for each ID
	var users []map[string]interface{}
	for _, userID := range userIDs {
		user, err := db.DBService.GetUserByID(userID)
		if err != nil {
			continue // Skip if user not found
		}
		users = append(users, map[string]interface{}{
			"id":         user.ID,
			"nickname":   user.Nickname,
			"fullName":   fmt.Sprintf("%s %s", user.FirstName, user.LastName),
			"first_name": user.FirstName,
			"last_name":  user.LastName,
			"avatar":     user.GetAvatar(),
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

// UpdatePostVisibilityHandler updates who can see a specific private post
func UpdatePostVisibilityHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Only PUT method allowed", http.StatusMethodNotAllowed)
		return
	}

	currentUserID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	postIDStr := utils.GetPathParam(r, "id")
	postID, err := strconv.ParseInt(postIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid post ID", http.StatusBadRequest)
		return
	}

	// Verify ownership
	post, err := db.DBService.GetPostByID(postID, int64(currentUserID))
	if err != nil {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}
	if post.AuthorID != int64(currentUserID) {
		http.Error(w, "You are not authorized to modify this post's visibility settings", http.StatusForbidden)
		return
	}

	var req struct {
		SelectedFollowers []int64 `json:"selected_followers"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Update post visibility
	err = db.DBService.DeletePostVisibilityForPost(postID)
	if err != nil {
		http.Error(w, "Error updating post visibility", http.StatusInternalServerError)
		return
	}

	err = db.DBService.CreatePostVisibilityForFollowers(postID, req.SelectedFollowers)
	if err != nil {
		http.Error(w, "Error updating post visibility", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Post visibility updated successfully"})
}

// GetPublicPostsHandler handles getting posts for public access (no authentication required)
func GetPublicPostsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Only GET method allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get public posts only (no authentication required)
	posts, err := db.DBService.GetPublicPosts()
	if err != nil {
		http.Error(w, "Error retrieving posts", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(posts)
}

// GetPublicPostsByUserHandler handles getting posts by a specific user for public access (no authentication required)
func GetPublicPostsByUserHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Only GET method allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get user ID from query parameter
	userIdParam := r.URL.Query().Get("userId")
	if userIdParam == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	targetUserID, err := strconv.ParseInt(userIdParam, 10, 64)
	if err != nil {
		http.Error(w, "Invalid user ID format", http.StatusBadRequest)
		return
	}

	// Get posts by specific user (currentUserID = 0 for anonymous access)
	posts, err := db.DBService.GetPostsByUser(targetUserID, 0)
	if err != nil {
		fmt.Printf("[API] Get public posts by user failed: %v\n", err)
		http.Error(w, "Failed to get posts", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(posts)
}
