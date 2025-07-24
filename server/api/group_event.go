package api

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/Golden76z/social-network/db"
	"github.com/Golden76z/social-network/middleware"
	"github.com/Golden76z/social-network/models"
)

// CreateGroupEventHandler handles the creation of a new group event
func CreateGroupEventHandler(w http.ResponseWriter, r *http.Request) {
	var req models.CreateGroupEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.GroupID == 0 || req.Title == "" || req.Description == "" || req.EventDateTime == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}
	// Validate datetime format
	if _, err := time.Parse("2006-01-02 15:04:05", req.EventDateTime); err != nil {
		http.Error(w, "Invalid event_date_time format", http.StatusBadRequest)
		return
	}
	// Get creatorID from context
	creatorID := int64(0)
	if ctxID, ok := r.Context().Value(middleware.UserIDKey).(int); ok {
		creatorID = int64(ctxID)
	}

	// 1. Check if group exists
	exists, err := db.DBService.GroupExists(req.GroupID)
	if err != nil {
		http.Error(w, "Error checking group existence", http.StatusInternalServerError)
		return
	}
	if !exists {
		http.Error(w, "Group does not exist", http.StatusBadRequest)
		return
	}

	// 2. Check if user is a member of the group
	isMember, err := db.DBService.IsUserInGroup(creatorID, req.GroupID)
	if err != nil {
		http.Error(w, "Error checking group membership", http.StatusInternalServerError)
		return
	}
	if !isMember {
		http.Error(w, "You must be a group member to create an event", http.StatusForbidden)
		return
	}

	if err := db.DBService.CreateGroupEvent(req, creatorID); err != nil {
		http.Error(w, "Error creating event", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"message": "Event created"}`))
}

// Handler to retrieve all events in a group
func GetGroupEventHandler(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	groupID, _ := strconv.ParseInt(q.Get("group_id"), 10, 64)

	// Get userID from context
	userID := int64(0)
	if ctxID, ok := r.Context().Value(middleware.UserIDKey).(int); ok {
		userID = int64(ctxID)
	}

	// Check if groupID is provided
	if groupID == 0 {
		http.Error(w, "Missing group_id parameter", http.StatusBadRequest)
		return
	}

	// Check if user is a member of the group
	isMember, err := db.DBService.IsUserInGroup(userID, groupID)
	if err != nil {
		http.Error(w, "Error checking group membership", http.StatusInternalServerError)
		return
	}
	if !isMember {
		http.Error(w, "Forbidden: you must be a group member to view events", http.StatusForbidden)
		return
	}

	upcoming := q.Get("upcoming") == "true"
	limit, _ := strconv.Atoi(q.Get("limit"))
	if limit == 0 {
		limit = 20
	}
	offset, _ := strconv.Atoi(q.Get("offset"))
	fromDate := q.Get("from_date")
	toDate := q.Get("to_date")

	events, err := db.DBService.GetGroupEvents(groupID, upcoming, limit, offset, fromDate, toDate)
	if err != nil {
		http.Error(w, "Error fetching events", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(events)
}

// Handler to update the content of an event
func UpdateGroupEventHandler(w http.ResponseWriter, r *http.Request) {
	var req models.UpdateGroupEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.ID == 0 {
		http.Error(w, "Missing event ID", http.StatusBadRequest)
		return
	}
	if req.Title == nil && req.Description == nil && req.EventDateTime == nil {
		http.Error(w, "No fields to update", http.StatusBadRequest)
		return
	}
	// Vérification du format de la date si fournie
	if req.EventDateTime != nil {
		if _, err := time.Parse("2006-01-02 15:04:05", *req.EventDateTime); err != nil {
			http.Error(w, "Invalid event_date_time format. Use YYYY-MM-DD HH:MM:SS", http.StatusBadRequest)
			return
		}
	}
	// Access control: only creator can update and must still be a group member
	event, err := db.DBService.GetGroupEventByID(req.ID)
	if err != nil {
		http.Error(w, "Event not found", http.StatusNotFound)
		return
	}
	userID := int64(0)
	if ctxID, ok := r.Context().Value(middleware.UserIDKey).(int); ok {
		userID = int64(ctxID)
	}
	if event.CreatorID != userID {
		http.Error(w, "Forbidden: only the creator can update this event", http.StatusForbidden)
		return
	}
	// Check if creator is still a member of the group
	isMember, err := db.DBService.IsUserInGroup(userID, event.GroupID)
	if err != nil {
		http.Error(w, "Error checking group membership", http.StatusInternalServerError)
		return
	}
	if !isMember {
		http.Error(w, "Forbidden: creator is no longer a member of the group", http.StatusForbidden)
		return
	}
	if err := db.DBService.UpdateGroupEvent(req.ID, req); err != nil {
		http.Error(w, "Error updating event", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Event updated"}`))
}

// Handler to delete an event in a group
func DeleteGroupEventHandler(w http.ResponseWriter, r *http.Request) {
	var req models.DeleteGroupEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.ID == 0 {
		http.Error(w, "Missing event ID", http.StatusBadRequest)
		return
	}
	event, err := db.DBService.GetGroupEventByID(req.ID)
	if err != nil {
		http.Error(w, "Event not found", http.StatusNotFound)
		return
	}
	userID := int64(0)
	if ctxID, ok := r.Context().Value(middleware.UserIDKey).(int); ok {
		userID = int64(ctxID)
	}
	// Only the creator can delete, or deletion is triggered by creator leaving the group (handled elsewhere)
	if event.CreatorID != userID {
		http.Error(w, "Forbidden: only the creator can delete this event", http.StatusForbidden)
		return
	}
	// Check if creator is still a member of the group
	isMember, err := db.DBService.IsUserInGroup(userID, event.GroupID)
	if err != nil {
		http.Error(w, "Error checking group membership", http.StatusInternalServerError)
		return
	}
	if !isMember {
		http.Error(w, "Forbidden: creator is no longer a member of the group", http.StatusForbidden)
		return
	}
	if err := db.DBService.DeleteGroupEvent(req.ID); err != nil {
		http.Error(w, "Error deleting event", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Event deleted"}`))
}
