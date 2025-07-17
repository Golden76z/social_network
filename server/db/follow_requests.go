package db

import (
	"github.com/Golden76z/social-network/models"
)

func (s *Service) CreateFollowRequest(requesterID, targetID int64, status string) error {
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
        INSERT INTO follow_requests (requester_id, target_id, status)
        VALUES (?, ?, ?)`,
		requesterID, targetID, status)
	return err
}

func (s *Service) GetFollowRequestByID(requestID int64) (*models.FollowRequest, error) {
	row := s.DB.QueryRow(`
        SELECT id, requester_id, target_id, status, created_at
        FROM follow_requests WHERE id = ?`, requestID)
	var fr models.FollowRequest
	err := row.Scan(&fr.ID, &fr.RequesterID, &fr.TargetID, &fr.Status, &fr.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &fr, nil
}

func (s *Service) UpdateFollowRequestStatus(requestID int64, status string) error {
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
        UPDATE follow_requests SET status = ? WHERE id = ?`,
		status, requestID)
	return err
}

func (s *Service) DeleteFollowRequest(requestID int64) error {
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
	_, err = tx.Exec(`DELETE FROM follow_requests WHERE id = ?`, requestID)
	return err
}
