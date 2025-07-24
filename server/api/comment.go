package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/Golden76z/social-network/db"
	"github.com/Golden76z/social-network/middleware"
	"github.com/Golden76z/social-network/models"
)

// Handler to create a new comment on a post
func CreateCommentHandler(w http.ResponseWriter, r *http.Request) {
	var req models.CreateCommentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	// Get userID from context (ignore req.UserID for security)
	userID := int64(0)
	if ctxID, ok := r.Context().Value(middleware.UserIDKey).(int); ok {
		userID = int64(ctxID)
	}
	req.UserID = userID

	if req.PostID == 0 || req.Body == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	// Vérifie que le post existe
	exists, err := db.DBService.PostExists(req.PostID)
	if err != nil {
		http.Error(w, "Error checking post existence", http.StatusInternalServerError)
		return
	}
	if !exists {
		http.Error(w, "Post does not exist", http.StatusBadRequest)
		return
	}

	if err := db.DBService.CreateComment(req); err != nil {
		http.Error(w, "Error creating comment", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"message": "Comment created"}`))
}

// Handler to get the list of comments under a post (20 by 20, or one by id)
func GetCommentHandler(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	commentID, _ := strconv.ParseInt(q.Get("id"), 10, 64)
	postID, _ := strconv.ParseInt(q.Get("post_id"), 10, 64)
	offset, _ := strconv.Atoi(q.Get("offset"))
	if offset < 0 {
		offset = 0
	}
	limit := 20

	if commentID != 0 {
		comment, err := db.DBService.GetCommentByID(commentID)
		if err != nil {
			http.Error(w, "Comment not found", http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(comment)
		return
	}

	// Get multiple comments for a post
	if postID == 0 {
		http.Error(w, "Missing post_id parameter", http.StatusBadRequest)
		return
	}
	comments, err := db.DBService.GetCommentsByPostID(postID, limit, offset)
	if err != nil {
		http.Error(w, "Error fetching comments", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(comments)
}

// Handler to modify the content of a comment
func UpdateCommentHandler(w http.ResponseWriter, r *http.Request) {
	var req models.UpdateCommentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	commentID, _ := strconv.ParseInt(r.URL.Query().Get("id"), 10, 64)
	if commentID == 0 {
		http.Error(w, "Missing comment id", http.StatusBadRequest)
		return
	}
	// Only the owner can update
	userID := int64(0)
	if ctxID, ok := r.Context().Value(middleware.UserIDKey).(int); ok {
		userID = int64(ctxID)
	}
	comment, err := db.DBService.GetCommentByID(commentID)
	if err != nil {
		http.Error(w, "Comment not found", http.StatusNotFound)
		return
	}
	if comment.UserID != userID {
		http.Error(w, "Forbidden: not your comment", http.StatusForbidden)
		return
	}
	if req.Body == nil || *req.Body == "" {
		http.Error(w, "No content to update", http.StatusBadRequest)
		return
	}
	if err := db.DBService.UpdateComment(commentID, req); err != nil {
		http.Error(w, "Error updating comment", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Comment updated"}`))
}

// Handler to remove a comment from a post
func DeleteCommentHandler(w http.ResponseWriter, r *http.Request) {
	var req models.DeleteCommentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.ID == 0 {
		http.Error(w, "Missing comment id", http.StatusBadRequest)
		return
	}
	// Only the owner can delete
	userID := int64(0)
	if ctxID, ok := r.Context().Value(middleware.UserIDKey).(int); ok {
		userID = int64(ctxID)
	}
	comment, err := db.DBService.GetCommentByID(req.ID)
	if err != nil {
		http.Error(w, "Comment not found", http.StatusNotFound)
		return
	}
	if comment.UserID != userID {
		http.Error(w, "Forbidden: not your comment", http.StatusForbidden)
		return
	}
	if err := db.DBService.DeleteComment(req.ID); err != nil {
		http.Error(w, "Error deleting comment", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Comment deleted"}`))
}
