package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/Golden76z/social-network/db"
	"github.com/Golden76z/social-network/middleware"
	"github.com/Golden76z/social-network/models"
)

// Handler to create a new Reaction (like/dislike)
func CreateUserReactionHandler(w http.ResponseWriter, r *http.Request) {
	currentUserID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	userID := int64(currentUserID)

	var req models.CreateReactionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.UserID = userID

	// Vérifier que la cible existe
	if req.PostID != nil {
		_, err := db.DBService.GetPostByID(*req.PostID)
		if err != nil {
			http.Error(w, "Post not found", http.StatusBadRequest)
			return
		}
	}
	if req.CommentID != nil {
		_, err := db.DBService.GetCommentByID(*req.CommentID)
		if err != nil {
			http.Error(w, "Comment not found", http.StatusBadRequest)
			return
		}
	}
	if req.GroupPostID != nil {
		_, err := db.DBService.GetGroupPostWithImagesByID(*req.GroupPostID, userID)
		if err != nil {
			http.Error(w, "Group post not found or not accessible", http.StatusBadRequest)
			return
		}
	}
	if req.GroupCommentID != nil {
		_, err := db.DBService.GetGroupCommentByID(*req.GroupCommentID, req.UserID)
		if err != nil {
			http.Error(w, "Group comment not found", http.StatusBadRequest)
			return
		}
	}

	// Vérifier qu’il n’existe pas déjà une réaction de ce user sur cette cible
	exists, err := db.DBService.UserReactionExists(userID, req.PostID, req.CommentID, req.GroupPostID, req.GroupCommentID)
	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}
	if exists {
		http.Error(w, "Reaction already exists", http.StatusConflict)
		return
	}

	if err := db.DBService.CreateLikeDislike(req); err != nil {
		http.Error(w, "Error creating reaction", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"response": "Reaction successfully created"}`))
}

// Handler to get a reaction by ID
func GetUserReactionHandler(w http.ResponseWriter, r *http.Request) {
	idParam := r.URL.Query().Get("id")
	reactionID, err := strconv.Atoi(idParam)
	if err != nil || reactionID <= 0 {
		http.Error(w, "Invalid reaction ID", http.StatusBadRequest)
		return
	}

	reaction, err := db.DBService.GetLikeDislikeByID(int64(reactionID))
	if err != nil {
		http.Error(w, "Reaction not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(reaction)
}

// Handler to update a reaction
func UpdateUserReactionHandler(w http.ResponseWriter, r *http.Request) {
	currentUserID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	userID := int64(currentUserID)

	var req models.UpdateReactionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Récupérer la réaction pour vérifier la propriété et le type
	reaction, err := db.DBService.GetLikeDislikeByID(req.ID)
	if err != nil {
		http.Error(w, "Reaction not found", http.StatusNotFound)
		return
	}
	if reaction.UserID != userID {
		http.Error(w, "Only the reaction owner can update", http.StatusForbidden)
		return
	}
	if reaction.Type == req.Type {
		http.Error(w, "No change: type is the same", http.StatusBadRequest)
		return
	}

	if err := db.DBService.UpdateLikeDislike(req.ID, req); err != nil {
		http.Error(w, "Error updating reaction", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"response": "Reaction successfully updated"}`))
}

// Handler to delete a reaction
func DeleteUserReactionHandler(w http.ResponseWriter, r *http.Request) {
	currentUserID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	userID := int64(currentUserID)

	var req models.DeleteReactionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Récupérer la réaction pour vérifier la propriété et le type
	reaction, err := db.DBService.GetLikeDislikeByID(req.ID)
	if err != nil {
		http.Error(w, "Reaction not found", http.StatusNotFound)
		return
	}
	if reaction.UserID != userID {
		http.Error(w, "Only the reaction owner can delete", http.StatusForbidden)
		return
	}
	if req.Type != "" && reaction.Type != req.Type {
		http.Error(w, "Type mismatch: cannot delete", http.StatusBadRequest)
		return
	}

	if err := db.DBService.DeleteLikeDislike(req.ID); err != nil {
		http.Error(w, "Error deleting reaction", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"response": "Reaction successfully deleted"}`))
}
