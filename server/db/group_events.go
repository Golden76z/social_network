package db

import (
	"github.com/Golden76z/social-network/models"
)

// GetGroupEvents retrieves group events with optional filters and pagination
func (s *Service) GetGroupEvents(groupID int64, upcoming bool, limit, offset int, fromDate, toDate string) ([]GroupEvent, error) {
	query := `SELECT id, group_id, creator_id, title, description, event_datetime, created_at FROM group_events WHERE 1=1`
	args := []interface{}{}

	if groupID != 0 {
		query += " AND group_id = ?"
		args = append(args, groupID)
	}
	if upcoming {
		query += " AND event_datetime > datetime('now')"
	}
	if fromDate != "" {
		query += " AND event_datetime >= ?"
		args = append(args, fromDate)
	}
	if toDate != "" {
		query += " AND event_datetime <= ?"
		args = append(args, toDate)
	}
	query += " ORDER BY event_datetime ASC"
	if limit > 0 {
		query += " LIMIT ?"
		args = append(args, limit)
	}
	if offset > 0 {
		query += " OFFSET ?"
		args = append(args, offset)
	}

	rows, err := s.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []GroupEvent
	for rows.Next() {
		var ge GroupEvent
		err := rows.Scan(&ge.ID, &ge.GroupID, &ge.CreatorID, &ge.Title, &ge.Description, &ge.EventDateTime, &ge.CreatedAt)
		if err != nil {
			return nil, err
		}
		events = append(events, ge)
	}
	return events, nil
}

// GroupEvent represents a group event in the database
type GroupEvent struct {
	ID            int64  `json:"id"`
	GroupID       int64  `json:"group_id"`
	CreatorID     int64  `json:"creator_id"`
	Title         string `json:"title"`
	Description   string `json:"description"`
	EventDateTime string `json:"event_datetime"`
	CreatedAt     string `json:"created_at"`
}

// CreateGroupEvent inserts a new group event into the database.
func (s *Service) CreateGroupEvent(request models.CreateGroupEventRequest, creatorID int64) error {
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
		INSERT INTO group_events (group_id, creator_id, title, description, event_datetime)
		VALUES (?, ?, ?, ?, ?)`,
		request.GroupID, creatorID, request.Title, request.Description, request.EventDateTime)
	return err
}

// GetGroupEventByID retrieves a group event by its ID.
func (s *Service) GetGroupEventByID(id int64) (*GroupEvent, error) {
	row := s.DB.QueryRow(`
		SELECT id, group_id, creator_id, title, description, event_datetime, created_at
		FROM group_events WHERE id = ?`, id)

	var ge GroupEvent
	err := row.Scan(
		&ge.ID,
		&ge.GroupID,
		&ge.CreatorID,
		&ge.Title,
		&ge.Description,
		&ge.EventDateTime,
		&ge.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &ge, nil
}

// UpdateGroupEvent updates a group event
func (s *Service) UpdateGroupEvent(id int64, request models.UpdateGroupEventRequest) error {
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

	// Build dynamic update query
	query := "UPDATE group_events SET"
	args := []interface{}{}
	updates := []string{}

	if request.Title != nil {
		updates = append(updates, " title = ?")
		args = append(args, *request.Title)
	}

	if request.Description != nil {
		updates = append(updates, " description = ?")
		args = append(args, *request.Description)
	}

	if request.EventDateTime != nil {
		updates = append(updates, " event_datetime = ?")
		args = append(args, *request.EventDateTime)
	}

	if len(updates) == 0 {
		return nil // No updates to perform
	}

	query += updates[0]
	for i := 1; i < len(updates); i++ {
		query += "," + updates[i]
	}

	query += " WHERE id = ?"
	args = append(args, id)

	_, err = tx.Exec(query, args...)
	return err
}

// DeleteGroupEvent removes a group event from the database by its ID.
func (s *Service) DeleteGroupEvent(id int64) error {
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
	_, err = tx.Exec(`DELETE FROM group_events WHERE id = ?`, id)
	return err
}
