package api

import (
	"encoding/json"
	"fmt"
	"net/http"

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
	// Implementation for getting a post
}

func UpdatePostHandler(w http.ResponseWriter, r *http.Request) {
	// Implementation for updating a post
}

func DeletePostHandler(w http.ResponseWriter, r *http.Request) {
	// Implementation for deleting a post
}
