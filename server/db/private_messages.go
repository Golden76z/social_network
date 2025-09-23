package db

import (
	"log"

	"github.com/Golden76z/social-network/models"
)

func (s *Service) CreatePrivateMessage(senderID, receiverID int, body string) (int64, error) {
	tx, err := s.DB.Begin()
	if err != nil {
		return 0, err
	}
	defer func() {
		if err != nil {
			if rollbackErr := tx.Rollback(); rollbackErr != nil {
				// Log rollback error but don't override original error
				log.Printf("Failed to rollback transaction: %v", rollbackErr)
			}
		} else {
			if commitErr := tx.Commit(); commitErr != nil {
				err = commitErr
			}
		}
	}()

	res, execErr := tx.Exec(`
        INSERT INTO private_messages (sender_id, receiver_id, body)
        VALUES (?, ?, ?)`, senderID, receiverID, body)
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

func (s *Service) GetPrivateMessageByID(id int) (*models.PrivateMessage, error) {
	row := s.DB.QueryRow(`
        SELECT id, sender_id, receiver_id, body, created_at
        FROM private_messages WHERE id = ?`, id)
	var pm models.PrivateMessage
	err := row.Scan(&pm.ID, &pm.SenderID, &pm.ReceiverID, &pm.Body, &pm.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &pm, nil
}

func (s *Service) DeletePrivateMessage(id int) error {
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
	_, err = tx.Exec(`DELETE FROM private_messages WHERE id = ?`, id)
	return err
}
