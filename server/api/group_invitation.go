package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/Golden76z/social-network/db"
	"github.com/Golden76z/social-network/middleware"
	"github.com/Golden76z/social-network/models"
)

// POST /api/group/invitation
func CreateGroupInvitationHandler(w http.ResponseWriter, r *http.Request) {
	var req models.InviteToGroupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	creatorID := int64(0)
	if ctxID, ok := r.Context().Value(middleware.UserIDKey).(int); ok {
		creatorID = int64(ctxID)
	}

	// Check if the user is a member of the group (creator or regular member)
	group, err := db.DBService.GetGroupByID(req.GroupID)
	if err != nil {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}

	// Check if the user is a member of the group (creator or regular member can invite)
	inviterIsMember, err := db.DBService.IsUserInGroup(creatorID, req.GroupID)
	if err != nil {
		http.Error(w, "Error checking membership", http.StatusInternalServerError)
		return
	}
	if !inviterIsMember {
		http.Error(w, "Only group members can send invitations", http.StatusForbidden)
		return
	}

	// Check if invited user is already a member
	isMember, err := db.DBService.IsUserInGroup(int64(req.UserID), req.GroupID)
	if err != nil {
		http.Error(w, "Error checking membership", http.StatusInternalServerError)
		return
	}
	if isMember {
		http.Error(w, "User is already a member of the group", http.StatusBadRequest)
		return
	}

	pendingInv, err := db.DBService.GetPendingGroupInvitation(req.GroupID, req.UserID)
	if err != nil {
		http.Error(w, "Error checking existing invitations", http.StatusInternalServerError)
		return
	}
	if pendingInv != nil {
		http.Error(w, "A pending invitation already exists for this user in this group", http.StatusBadRequest)
		return
	}

	// Create invitation
	if err := db.DBService.CreateGroupInvitation(req, int(creatorID)); err != nil {
		http.Error(w, "Error creating invitation", http.StatusInternalServerError)
		return
	}

	// Create notification for the invited user
	invitedUser, err := db.DBService.GetUserByID(req.UserID)
	if err == nil {
		avatar := ""
		if invitedUser.Avatar.Valid {
			avatar = invitedUser.Avatar.String
		}
		notificationData := fmt.Sprintf(`{"group_id": %d, "group_name": "%s", "inviter_id": %d, "inviter_nickname": "%s", "inviter_avatar": "%s", "type": "group_invite"}`,
			req.GroupID, group.Title, creatorID, invitedUser.Nickname, avatar)
		notificationReq := models.CreateNotificationRequest{
			UserID: req.UserID,
			Type:   "group_invite",
			Data:   notificationData,
		}
		db.DBService.CreateNotification(notificationReq)
	}

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"message": "Invitation sent"}`))
}

// GET /api/group/invitation?id=123 OR /api/group/invitation?group_id=1
func GetGroupInvitationHandler(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	id, _ := strconv.ParseInt(q.Get("id"), 10, 64)
	groupID, _ := strconv.ParseInt(q.Get("group_id"), 10, 64)

	if id != 0 {
		inv, err := db.DBService.GetGroupInvitationByID(id)
		if err != nil {
			http.Error(w, "Invitation not found", http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(inv)
		return
	}

	if groupID != 0 {
		invitations, err := db.DBService.GetGroupInvitationsByGroupID(groupID)
		if err != nil {
			http.Error(w, "Error fetching invitations", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(invitations)
		return
	}

	http.Error(w, "Missing id or group_id parameter", http.StatusBadRequest)
}

// PUT /api/group/invitation
// Only the invited user can accept or decline
func UpdateGroupInvitationHandler(w http.ResponseWriter, r *http.Request) {
	type UpdateInvitationRequest struct {
		ID     int64  `json:"id"`
		Status string `json:"status"` // "accepted" or "declined"
	}
	var req UpdateInvitationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.Status != "accepted" && req.Status != "declined" {
		http.Error(w, "Invalid status", http.StatusBadRequest)
		return
	}
	userID := int64(0)
	if ctxID, ok := r.Context().Value(middleware.UserIDKey).(int); ok {
		userID = int64(ctxID)
	}

	inv, err := db.DBService.GetGroupInvitationByID(req.ID)
	if err != nil {
		http.Error(w, "Invitation not found", http.StatusNotFound)
		return
	}
	if inv.InvitedUserID != userID {
		http.Error(w, "Only the invited user can respond", http.StatusForbidden)
		return
	}
	if inv.Status != "pending" {
		http.Error(w, "Invitation already responded", http.StatusBadRequest)
		return
	}

	if err := db.DBService.UpdateGroupInvitationStatus(req.ID, req.Status); err != nil {
		http.Error(w, "Error updating invitation", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Invitation updated"}`))

	if req.Status == "accepted" {
		member := models.GroupMember{
			GroupID:   inv.GroupID,
			UserID:    userID,
			Role:      "member",
			InvitedBy: &inv.InvitedBy,
		}
		if err := db.DBService.CreateGroupMember(member); err != nil {
			http.Error(w, "Error adding user to group", http.StatusInternalServerError)
			return
		}
	}
}

// DELETE /api/group/invitation
// Only the creator can delete the invitation
func DeleteGroupInvitationHandler(w http.ResponseWriter, r *http.Request) {
	type DeleteInvitationRequest struct {
		ID int64 `json:"id"`
	}
	var req DeleteInvitationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	userID := int64(0)
	if ctxID, ok := r.Context().Value(middleware.UserIDKey).(int); ok {
		userID = int64(ctxID)
	}

	inv, err := db.DBService.GetGroupInvitationByID(req.ID)
	if err != nil {
		http.Error(w, "Invitation not found", http.StatusNotFound)
		return
	}
	// Only creator can delete
	group, err := db.DBService.GetGroupByID(inv.GroupID)
	if err != nil {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}
	if group.CreatorID != userID {
		http.Error(w, "Only the group creator can delete the invitation", http.StatusForbidden)
		return
	}

	if inv.Status != "pending" {
		http.Error(w, "Cannot delete an invitation that has been accepted or declined", http.StatusBadRequest)
		return
	}

	if err := db.DBService.DeleteGroupInvitation(req.ID); err != nil {
		http.Error(w, "Error deleting invitation", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Invitation deleted"}`))
}
