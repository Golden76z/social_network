package db

import (
	"github.com/Golden76z/social-network/models"
)

// EventRSVP represents an event RSVP in the database
type EventRSVP struct {
	ID        int64  `json:"id"`
	EventID   int64  `json:"event_id"`
	UserID    int64  `json:"user_id"`
	Status    string `json:"status"`
	CreatedAt string `json:"created_at"`
}

func (s *Service) CreateEventRSVP(request models.RSVPToEventRequest) error {
	tx, err := s.DB.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		} else {
			_ = tx.Commit()
		}
	}()
	_, err = tx.Exec(`
        INSERT INTO event_rsvps (event_id, user_id, status)
        VALUES (?, ?, ?)`, request.EventID, request.UserID, request.Status)
	return err
}

func (s *Service) GetEventRSVPByID(id int64) (*EventRSVP, error) {
	row := s.DB.QueryRow(`
        SELECT id, event_id, user_id, status, created_at
        FROM event_rsvps WHERE id = ?`, id)
	var rsvp EventRSVP
	err := row.Scan(&rsvp.ID, &rsvp.EventID, &rsvp.UserID, &rsvp.Status, &rsvp.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &rsvp, nil
}

// Get RSVP by user and event
func (s *Service) GetEventRSVPByUserAndEvent(eventID, userID int64) (*EventRSVP, error) {
	row := s.DB.QueryRow(`SELECT id, event_id, user_id, status, created_at FROM event_rsvps WHERE event_id = ? AND user_id = ?`, eventID, userID)
	var rsvp EventRSVP
	err := row.Scan(&rsvp.ID, &rsvp.EventID, &rsvp.UserID, &rsvp.Status, &rsvp.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &rsvp, nil
}

// Get RSVPs for an event with optional status filter and pagination
func (s *Service) GetEventRSVPs(eventID int64, status string, limit, offset int) ([]EventRSVP, error) {
	query := `SELECT id, event_id, user_id, status, created_at FROM event_rsvps WHERE event_id = ?`
	args := []interface{}{eventID}
	if status != "" {
		query += " AND status = ?"
		args = append(args, status)
	}
	query += " LIMIT ? OFFSET ?"
	args = append(args, limit, offset)
	rows, err := s.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var rsvps []EventRSVP
	for rows.Next() {
		var rsvp EventRSVP
		if err := rows.Scan(&rsvp.ID, &rsvp.EventID, &rsvp.UserID, &rsvp.Status, &rsvp.CreatedAt); err != nil {
			return nil, err
		}
		rsvps = append(rsvps, rsvp)
	}
	return rsvps, nil
}

func (s *Service) UpdateEventRSVPStatus(id int64, status string) error {
	tx, err := s.DB.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		} else {
			_ = tx.Commit()
		}
	}()
	_, err = tx.Exec(`UPDATE event_rsvps SET status = ? WHERE id = ?`, status, id)
	return err
}

func (s *Service) DeleteEventRSVP(id int64) error {
	tx, err := s.DB.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		} else {
			_ = tx.Commit()
		}
	}()
	_, err = tx.Exec(`DELETE FROM event_rsvps WHERE id = ?`, id)
	return err
}
