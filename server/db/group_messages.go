package db

import (
	"database/sql"
)

// GroupMessage represents a group message in the database
type GroupMessage struct {
	ID        int64  `json:"id"`
	GroupID   int64  `json:"group_id"`
	SenderID  int64  `json:"sender_id"`
	Body      string `json:"body"`
	CreatedAt string `json:"created_at"`
}

func (s *Service) CreateGroupMessage(groupID, senderID int64, body string) error {
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

func (s *Service) GetGroupMessageByID(id int64) (*GroupMessage, error) {
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

func DeleteGroupMessage(db *sql.DB, id int64) error {
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

// GetGroupMessages returns messages from a specific group
func (s *Service) GetGroupMessages(groupID int64, limit, offset int) ([]GroupMessage, error) {
	rows, err := s.DB.Query(`
		SELECT gm.id, gm.group_id, gm.sender_id, gm.body, gm.created_at,
		       u.nickname, u.first_name, u.last_name, u.avatar
		FROM group_messages gm
		JOIN users u ON gm.sender_id = u.id
		WHERE gm.group_id = ?
		ORDER BY gm.created_at DESC
		LIMIT ? OFFSET ?
	`, groupID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []GroupMessage
	for rows.Next() {
		var msg GroupMessage
		var nickname, firstName, lastName, avatar sql.NullString
		err := rows.Scan(
			&msg.ID, &msg.GroupID, &msg.SenderID, &msg.Body, &msg.CreatedAt,
			&nickname, &firstName, &lastName, &avatar,
		)
		if err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}
	return messages, nil
}

// CheckGroupMembership checks if a user is a member of a group
func (s *Service) CheckGroupMembership(userID int64, groupID int64) (bool, error) {
	var exists bool
	err := s.DB.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM group_members 
			WHERE user_id = ? AND group_id = ?
		)
	`, userID, groupID).Scan(&exists)
	return exists, err
}
