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
		fmt.Printf("[ERROR] Create post failed: %v\n", err)
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
	fmt.Println("test")
	if r.Method != http.MethodGet {
		http.Error(w, "Only GET method allowed", http.StatusMethodNotAllowed)
		return
	}

	fmt.Println("test1")
	currentUserID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	fmt.Println("test2")
	idParam := r.URL.Query().Get("id")

	if idParam != "" {
		fmt.Println("test3")
		postID, err := strconv.ParseInt(idParam, 10, 64)
		if err != nil {
			http.Error(w, "Invalid post ID format", http.StatusBadRequest)
			return
		}

		fmt.Println("test4")
		post, err := db.DBService.GetPostByID(postID, int64(currentUserID))
		if err != nil {
			if err.Error() == "unauthorized" {
				http.Error(w, "You are not authorized to view this post", http.StatusForbidden)
				return
			}
			http.Error(w, "Post not found", http.StatusNotFound)
			return
		}

		fmt.Println("test5")
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(post)
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

	posts, err := db.DBService.GetUserFeed(currentUserID, limit, offset)
	if err != nil {
		fmt.Printf("[ERROR] Get user feed failed: %v\n", err)
		http.Error(w, "Failed to get user feed", http.StatusInternalServerError)
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
		fmt.Printf("[ERROR] Update post failed: %v\n", err)
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
		fmt.Printf("[ERROR] Delete post failed: %v\n", err)
		http.Error(w, "Failed to delete post", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Post deleted successfully"})
}
