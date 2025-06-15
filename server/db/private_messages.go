package db

import (
	"database/sql"

	"github.com/Golden76z/social-network/models"
)

func CreatePrivateMessage(db *sql.DB, senderID, receiverID int64, body string) error {
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
        INSERT INTO private_messages (sender_id, receiver_id, body)
        VALUES (?, ?, ?)`, senderID, receiverID, body)
	return err
}

func GetPrivateMessageByID(db *sql.DB, id int64) (*models.PrivateMessage, error) {
	row := db.QueryRow(`
        SELECT id, sender_id, receiver_id, body, created_at
        FROM private_messages WHERE id = ?`, id)
	var pm models.PrivateMessage
	err := row.Scan(&pm.ID, &pm.SenderID, &pm.ReceiverID, &pm.Body, &pm.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &pm, nil
}

func DeletePrivateMessage(db *sql.DB, id int64) error {
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
	_, err = tx.Exec(`DELETE FROM private_messages WHERE id = ?`, id)
	return err
}
