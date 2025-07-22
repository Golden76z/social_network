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

	// Getting the offlimit from the url
	offsetStr := query.Get("offlimit")
	groupidStr := query.Get("groupID")

	w.Header().Set("Content-Type", "application/json")

	// Converting offSet and groupID to int's
	offSet, errOffSet := strconv.ParseInt(offsetStr, 10, 64)
	groupID, errGroupID := strconv.ParseInt(groupidStr, 10, 64)
	if errOffSet != nil || errGroupID != nil {
		http.Error(w, "Missing id or offlimit query parameter", http.StatusBadRequest)
		return
	}

	fmt.Println("Sending paramaeters: ", offSet, groupID)

	// Get the list of post
	post, err := db.DBService.GetGroupPostsWithImagesByGroupID(groupID, int(offSet), int64(userID))
	if err != nil {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	// Sending back an array of post
	json.NewEncoder(w).Encode(post)
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
	existingPost, err := db.DBService.GetGroupPostWithImagesByID(req.ID, int64(userID))
	if err != nil {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	// // Check if the user is authorized to update this post
	if existingPost.UserID != int64(userID) {
		http.Error(w, "Forbidden: You can only update your own posts", http.StatusForbidden)
		return
	}

	// Update the group post in database
	if err := db.DBService.UpdateGroupPost(req, int64(userID)); err != nil {
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
	existingPost, err := db.DBService.GetGroupPostWithImagesByID(req.ID, int64(userID))
	if err != nil {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	// // Check if the user is authorized to delete this post
	if existingPost.UserID != int64(userID) {
		http.Error(w, "Forbidden: You can only delete your own posts", http.StatusForbidden)
		return
	}

	// Delete the group post from database
	if err := db.DBService.DeleteGroupPost(req.ID, int64(userID)); err != nil {
		http.Error(w, "Error deleting the group post", http.StatusInternalServerError)
		return
	}

	// Send back a response to the client-side in case of success
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"response": "Group Post successfully deleted"}`))
}
