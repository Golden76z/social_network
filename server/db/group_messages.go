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

// GroupMessageWithUser represents a group message with user information
type GroupMessageWithUser struct {
	ID              int    `json:"id"`
	GroupID         int    `json:"group_id"`
	SenderID        int    `json:"sender_id"`
	SenderNickname  string `json:"sender_nickname"`
	SenderFirstName string `json:"sender_first_name"`
	SenderLastName  string `json:"sender_last_name"`
	Body            string `json:"body"`
	CreatedAt       string `json:"created_at"`
}

func (s *Service) CreateGroupMessage(groupID, senderID int, body string) (int64, error) {
	tx, err := s.DB.Begin()
	if err != nil {
		return 0, err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		} else {
			_ = tx.Commit()
		}
	}()
	res, execErr := tx.Exec(`
        INSERT INTO group_messages (group_id, sender_id, body)
        VALUES (?, ?, ?)`, groupID, senderID, body)
	if execErr != nil {
		err = execErr
		return 0, execErr
	}

	messageID, lastIDErr := res.LastInsertId()
	if lastIDErr != nil {
		err = lastIDErr
		return 0, lastIDErr
	}

	return messageID, nil
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

// GetGroupMessagesWithUser retrieves group messages with user information
func (s *Service) GetGroupMessagesWithUser(groupID int, limit, offset int) ([]GroupMessageWithUser, error) {
	query := `
		SELECT 
			gm.id, 
			gm.group_id, 
			gm.sender_id, 
			u.nickname as sender_nickname,
			u.first_name as sender_first_name,
			u.last_name as sender_last_name,
			gm.body, 
			gm.created_at
		FROM group_messages gm
		JOIN users u ON gm.sender_id = u.id
		WHERE gm.group_id = ?
		ORDER BY gm.created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := s.DB.Query(query, groupID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []GroupMessageWithUser
	for rows.Next() {
		var msg GroupMessageWithUser
		err := rows.Scan(
			&msg.ID,
			&msg.GroupID,
			&msg.SenderID,
			&msg.SenderNickname,
			&msg.SenderFirstName,
			&msg.SenderLastName,
			&msg.Body,
			&msg.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}

	return messages, nil
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
