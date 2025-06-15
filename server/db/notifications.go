package db

import (
	"database/sql"

	"github.com/Golden76z/social-network/models"
)

func CreateNotification(db *sql.DB, userID int64, notifType, data string) error {
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
        INSERT INTO notifications (user_id, type, data)
        VALUES (?, ?, ?)`, userID, notifType, data)
	return err
}

func GetNotificationByID(db *sql.DB, id int64) (*models.Notification, error) {
	row := db.QueryRow(`
        SELECT id, user_id, type, data, is_read, created_at
        FROM notifications WHERE id = ?`, id)
	var n models.Notification
	err := row.Scan(&n.ID, &n.UserID, &n.Type, &n.Data, &n.IsRead, &n.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &n, nil
}

func MarkNotificationRead(db *sql.DB, id int64) error {
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
	_, err = tx.Exec(`UPDATE notifications SET is_read = TRUE WHERE id = ?`, id)
	return err
}

func DeleteNotification(db *sql.DB, id int64) error {
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
	_, err = tx.Exec(`DELETE FROM notifications WHERE id = ?`, id)
	return err
}
