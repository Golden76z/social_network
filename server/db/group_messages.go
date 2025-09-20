package db

import (
	"database/sql"
)

// GroupMessage represents a group message in the database
type GroupMessage struct {
	ID        int    `json:"id"`
	GroupID   int    `json:"group_id"`
	SenderID  int    `json:"sender_id"`
	Body      string `json:"body"`
	CreatedAt string `json:"created_at"`
}

func (s *Service) CreateGroupMessage(groupID, senderID int, body string) error {
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
        INSERT INTO group_messages (group_id, sender_id, body)
        VALUES (?, ?, ?)`, groupID, senderID, body)
	return err
}

func (s *Service) GetGroupMessageByID(id int) (*GroupMessage, error) {
	row := s.DB.QueryRow(`
        SELECT id, group_id, sender_id, body, created_at
        FROM group_messages WHERE id = ?`, id)
	var gm GroupMessage
	err := row.Scan(&gm.ID, &gm.GroupID, &gm.SenderID, &gm.Body, &gm.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &gm, nil
}

func DeleteGroupMessage(db *sql.DB, id int) error {
	tx, err := db.Begin()
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
	_, err = tx.Exec(`DELETE FROM group_messages WHERE id = ?`, id)
	return err
}
