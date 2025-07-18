package db

import (
	"github.com/Golden76z/social-network/models"
)

func (s *Service) CreateNotification(request models.CreateNotificationRequest) error {
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
        INSERT INTO notifications (user_id, type, data)
        VALUES (?, ?, ?)`, request.UserID, request.Type, request.Data)
	return err
}

func (s *Service) GetNotificationByID(id int64) (*models.NotificationResponse, error) {
	row := s.DB.QueryRow(`
        SELECT id, user_id, type, data, is_read, created_at
        FROM notifications WHERE id = ?`, id)
	var n models.NotificationResponse
	err := row.Scan(&n.ID, &n.UserID, &n.Type, &n.Data, &n.IsRead, &n.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &n, nil
}

func (s *Service) UpdateNotification(id int64, request models.UpdateNotificationRequest) error {
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
	_, err = tx.Exec(`UPDATE notifications SET is_read = ? WHERE id = ?`, request.IsRead, id)
	return err
}

func (s *Service) MarkNotificationRead(id int64) error {
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
	_, err = tx.Exec(`UPDATE notifications SET is_read = TRUE WHERE id = ?`, id)
	return err
}

func (s *Service) DeleteNotification(id int64) error {
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
	_, err = tx.Exec(`DELETE FROM notifications WHERE id = ?`, id)
	return err
}
