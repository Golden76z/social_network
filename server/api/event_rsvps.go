package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/Golden76z/social-network/db"
	"github.com/Golden76z/social-network/middleware"
	"github.com/Golden76z/social-network/models"
)

// POST /api/group/event/rsvp
// Only group members (including event creator) can RSVP.
// Status must be "going", "interested", or "not_going".
func RSVPToEventHandler(w http.ResponseWriter, r *http.Request) {
	var req models.RSVPToEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	userID := int64(0)
	if ctxID, ok := r.Context().Value(middleware.UserIDKey).(int); ok {
		userID = int64(ctxID)
	}
	req.UserID = userID

	// Accept only "come", "interested", "not_come"
	if req.Status != "come" && req.Status != "interested" && req.Status != "not_come" {
		http.Error(w, "Invalid status", http.StatusBadRequest)
		return
	}

	event, err := db.DBService.GetGroupEventByID(req.EventID)
	if err != nil {
		http.Error(w, "Event not found", http.StatusNotFound)
		return
	}
	isMember, err := db.DBService.IsUserInGroup(userID, event.GroupID)
	if err != nil {
		http.Error(w, "Error checking group membership", http.StatusInternalServerError)
		return
	}
	if !isMember {
		http.Error(w, "You must be a group member to RSVP", http.StatusForbidden)
		return
	}

	existing, _ := db.DBService.GetEventRSVPByUserAndEvent(req.EventID, userID)
	if existing != nil {
		http.Error(w, "RSVP already exists. Use PUT to update.", http.StatusBadRequest)
		return
	}
	if err := db.DBService.CreateEventRSVP(req); err != nil {
		http.Error(w, "Error creating RSVP", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"message": "RSVP created"}`))
}

// GET /api/group/event/rsvp?event_id=123&status=going&limit=20&offset=0
// Only group members can view RSVPs for an event.
func GetEventRSVPsHandler(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	eventID, _ := strconv.ParseInt(q.Get("event_id"), 10, 64)
	status := q.Get("status")
	limit, _ := strconv.Atoi(q.Get("limit"))
	if limit == 0 {
		limit = 50
	}
	offset, _ := strconv.Atoi(q.Get("offset"))

	// Get userID from context
	userID := int64(0)
	if ctxID, ok := r.Context().Value(middleware.UserIDKey).(int); ok {
		userID = int64(ctxID)
	}

	// Check event exists and get groupID
	event, err := db.DBService.GetGroupEventByID(eventID)
	if err != nil {
		http.Error(w, "Event not found", http.StatusNotFound)
		return
	}
	// Check user is member of the group
	isMember, err := db.DBService.IsUserInGroup(userID, event.GroupID)
	if err != nil {
		http.Error(w, "Error checking group membership", http.StatusInternalServerError)
		return
	}
	if !isMember {
		http.Error(w, "You must be a group member to view RSVPs", http.StatusForbidden)
		return
	}

	rsvps, err := db.DBService.GetEventRSVPs(eventID, status, limit, offset)
	if err != nil {
		http.Error(w, "Error fetching RSVPs", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(rsvps)
}

// PUT /api/group/event/rsvp
func UpdateEventRSVPHandler(w http.ResponseWriter, r *http.Request) {
	var req models.RSVPToEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	userID := int64(0)
	if ctxID, ok := r.Context().Value(middleware.UserIDKey).(int); ok {
		userID = int64(ctxID)
	}
	req.UserID = userID

	// Accept only "come", "interested", "not_come"
	if req.Status != "come" && req.Status != "interested" && req.Status != "not_come" {
		http.Error(w, "Invalid status", http.StatusBadRequest)
		return
	}

	existing, err := db.DBService.GetEventRSVPByUserAndEvent(req.EventID, userID)
	if err != nil || existing == nil {
		http.Error(w, "RSVP not found. Use POST to create.", http.StatusNotFound)
		return
	}
	if existing.Status == req.Status {
		http.Error(w, "You already set this RSVP status", http.StatusBadRequest)
		return
	}
	if err := db.DBService.UpdateEventRSVPStatus(existing.ID, req.Status); err != nil {
		http.Error(w, "Error updating RSVP", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "RSVP updated"}`))
}

// DELETE /api/group/event/rsvp
func DeleteEventRSVPHandler(w http.ResponseWriter, r *http.Request) {
	var req models.CancelRSVPRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	userID := int64(0)
	if ctxID, ok := r.Context().Value(middleware.UserIDKey).(int); ok {
		userID = int64(ctxID)
	}
	req.UserID = userID

	existing, err := db.DBService.GetEventRSVPByUserAndEvent(req.EventID, userID)
	if err != nil || existing == nil {
		http.Error(w, "RSVP not found", http.StatusNotFound)
		return
	}
	if req.Status != "" && req.Status != existing.Status {
		http.Error(w, "Status does not match current RSVP", http.StatusBadRequest)
		return
	}
	if err := db.DBService.DeleteEventRSVP(existing.ID); err != nil {
		http.Error(w, "Error deleting RSVP", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "RSVP deleted"}`))
}
