package db

import (
	"database/sql"
)

// GroupRequest represents a group join request in the database
type GroupRequest struct {
	ID        int64  `json:"id"`
	GroupID   int64  `json:"group_id"`
	UserID    int64  `json:"user_id"`
	Status    string `json:"status"`
	CreatedAt string `json:"created_at"`
}

func CreateGroupRequest(db *sql.DB, groupID, userID int64, status string) error {
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
	_, err = tx.Exec(`
        INSERT INTO group_requests (group_id, user_id, status)
        VALUES (?, ?, ?)`, groupID, userID, status)
	return err
}

func GetGroupRequestByID(db *sql.DB, id int64) (*GroupRequest, error) {
	row := db.QueryRow(`
        SELECT id, group_id, user_id, status, created_at
        FROM group_requests WHERE id = ?`, id)
	var gr GroupRequest
	err := row.Scan(&gr.ID, &gr.GroupID, &gr.UserID, &gr.Status, &gr.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &gr, nil
}

func UpdateGroupRequestStatus(db *sql.DB, id int64, status string) error {
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
	_, err = tx.Exec(`UPDATE group_requests SET status = ? WHERE id = ?`, status, id)
	return err
}

func DeleteGroupRequest(db *sql.DB, id int64) error {
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
	_, err = tx.Exec(`DELETE FROM group_requests WHERE id = ?`, id)
	return err
}
