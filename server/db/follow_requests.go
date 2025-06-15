package db

import (
	"database/sql"

	"github.com/Golden76z/social-network/models"
)

func CreateFollowRequest(db *sql.DB, requesterID, targetID int64, status string) error {
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
        INSERT INTO follow_requests (requester_id, target_id, status)
        VALUES (?, ?, ?)`,
		requesterID, targetID, status)
	return err
}

func GetFollowRequestByID(db *sql.DB, requestID int64) (*models.FollowRequest, error) {
	row := db.QueryRow(`
        SELECT id, requester_id, target_id, status, created_at
        FROM follow_requests WHERE id = ?`, requestID)
	var fr models.FollowRequest
	err := row.Scan(&fr.ID, &fr.RequesterID, &fr.TargetID, &fr.Status, &fr.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &fr, nil
}

func UpdateFollowRequestStatus(db *sql.DB, requestID int64, status string) error {
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
        UPDATE follow_requests SET status = ? WHERE id = ?`,
		status, requestID)
	return err
}

func DeleteFollowRequest(db *sql.DB, requestID int64) error {
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
	_, err = tx.Exec(`DELETE FROM follow_requests WHERE id = ?`, requestID)
	return err
}
