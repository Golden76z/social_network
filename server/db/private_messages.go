package db

import (
	"github.com/Golden76z/social-network/models"
)

func (s *Service) CreatePrivateMessage(senderID, receiverID int, body string) error {
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
        INSERT INTO private_messages (sender_id, receiver_id, body)
        VALUES (?, ?, ?)`, senderID, receiverID, body)
	return err
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
