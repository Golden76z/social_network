package api

import (
	"encoding/json"
	"net/http"

	"github.com/Golden76z/social-network/db"
	"github.com/Golden76z/social-network/middleware"
	"github.com/Golden76z/social-network/models"
)

// Handler to get all pending follow requests for the current user
func GetFollowRequestHandler(w http.ResponseWriter, r *http.Request) {
	currentUserID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	userID := int64(currentUserID)

	requests, err := db.DBService.GetPendingFollowRequests(userID)
	if err != nil {
		http.Error(w, "Error fetching follow requests", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(requests)
}

// CreateFollowHandler handles follow requests (public: auto-accept, private: pending request)
func CreateFollowHandler(w http.ResponseWriter, r *http.Request) {
	currentUserID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	userID := int64(currentUserID)

	var req models.CreateFollowRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Prevent self-follow
	if req.TargetID == userID {
		http.Error(w, "You cannot follow yourself", http.StatusBadRequest)
		return
	}

	// Check if target user exists
	targetUser, err := db.DBService.GetUserByID(req.TargetID)
	if err != nil {
		http.Error(w, "Target user not found", http.StatusBadRequest)
		return
	}

	// Check for existing follow request (pending or accepted)
	existing, err := db.DBService.GetFollowRequestBetween(userID, req.TargetID)
	if err == nil && (existing.Status == "pending" || existing.Status == "accepted") {
		http.Error(w, "Follow request already exists", http.StatusConflict)
		return
	}

	// If public profile, auto-accept
	if !targetUser.IsPrivate {
		err := db.DBService.CreateFollowRequest(userID, req.TargetID, "accepted")
		if err != nil {
			http.Error(w, "Error creating follow relationship", http.StatusInternalServerError)
			return
		}
		// Increment counts (pseudo-code, implement in DB as needed)
		_ = db.DBService.IncrementFollowingCount(userID)
		_ = db.DBService.IncrementFollowersCount(req.TargetID)
		w.WriteHeader(http.StatusCreated)
		w.Write([]byte(`{"message": "You are now following this user"}`))
		return
	}

	// If private profile, create a pending request (allow resending if last was rejected)
	err = db.DBService.CreateFollowRequest(userID, req.TargetID, "pending")
	if err != nil {
		http.Error(w, "Error creating follow request", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"message": "Follow request sent"}`))
}

// Handler to get the list of the follower
func GetFollowerHandler(w http.ResponseWriter, r *http.Request) {
	currentUserID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	userID := int64(currentUserID)

	followers, err := db.DBService.GetFollowers(userID)
	if err != nil {
		http.Error(w, "Error fetching followers", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(followers)
}

// Handler to get the list of user's you are following
func GetFollowingHandler(w http.ResponseWriter, r *http.Request) {
	currentUserID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	userID := int64(currentUserID)

	following, err := db.DBService.GetFollowing(userID)
	if err != nil {
		http.Error(w, "Error fetching following", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(following)
}

// Handler to Accept/Decline a follow request
func UpdateFollowHandler(w http.ResponseWriter, r *http.Request) {
	currentUserID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	userID := int64(currentUserID)

	var req struct {
		RequestID int64  `json:"request_id"`
		Status    string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Vérifier que la demande existe et que l'utilisateur courant est bien la cible
	followReq, err := db.DBService.GetFollowRequestByID(req.RequestID)
	if err != nil {
		http.Error(w, "Follow request not found", http.StatusNotFound)
		return
	}
	if followReq.TargetID != userID {
		http.Error(w, "Not authorized to update this follow request", http.StatusForbidden)
		return
	}

	// Seuls les statuts accepted ou rejected sont valides
	if req.Status != "accepted" && req.Status != "rejected" {
		http.Error(w, "Invalid status", http.StatusBadRequest)
		return
	}

	// Ne pas permettre de mettre à jour si le statut est déjà celui demandé
	if followReq.Status == req.Status {
		http.Error(w, "Request already has this status", http.StatusBadRequest)
		return
	}

	err = db.DBService.UpdateFollowRequestStatus(req.RequestID, req.Status)
	if err != nil {
		http.Error(w, "Error updating follow request", http.StatusInternalServerError)
		return
	}

	// Si accepté, incrémenter les compteurs
	if req.Status == "accepted" {
		_ = db.DBService.IncrementFollowingCount(followReq.RequesterID)
		_ = db.DBService.IncrementFollowersCount(followReq.TargetID)
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Follow request updated"}`))
}

// Handler to get rid of a follow / delete a follow request
func DeleteFollowHandler(w http.ResponseWriter, r *http.Request) {

}
