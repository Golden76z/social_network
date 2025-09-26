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

// GetUserNotifications retrieves notifications for a user with pagination
func (s *Service) GetUserNotifications(userID int64, limit, offset int, unreadOnly bool) ([]*models.NotificationResponse, error) {
	query := `SELECT id, user_id, type, data, is_read, created_at FROM notifications WHERE user_id = ?`
	args := []interface{}{userID}

	if unreadOnly {
		query += " AND is_read = FALSE"
	}

	query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	rows, err := s.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notifications []*models.NotificationResponse
	for rows.Next() {
		var n models.NotificationResponse
		if err := rows.Scan(&n.ID, &n.UserID, &n.Type, &n.Data, &n.IsRead, &n.CreatedAt); err != nil {
			return nil, err
		}
		notifications = append(notifications, &n)
	}

	return notifications, nil
}

// DeleteNotificationsByTypeAndData deletes notifications matching the given type and data pattern
func (s *Service) DeleteNotificationsByTypeAndData(notificationType, dataPattern string) error {
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
		DELETE FROM notifications 
		WHERE type = ? AND data LIKE ?
	`, notificationType, "%"+dataPattern+"%")

	return err
}

// MarkNotificationAsExpired marks a notification as expired by updating its data
func (s *Service) MarkNotificationAsExpired(notificationID int64) error {
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
		UPDATE notifications 
		SET data = json_set(data, '$.expired', true, '$.message', 'This request has been cancelled')
		WHERE id = ?
	`, notificationID)

	return err
}
