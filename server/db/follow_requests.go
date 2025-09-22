package db

import (
	"github.com/Golden76z/social-network/models"
)

// GetPendingFollowRequests retourne toutes les follow requests en attente pour l'utilisateur cible
func (s *Service) GetPendingFollowRequests(userID int64) ([]models.FollowRequest, error) {
	rows, err := s.DB.Query(`
			   SELECT id, requester_id, target_id, status, created_at
			   FROM follow_requests
			   WHERE target_id = ? AND status = 'pending'`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var requests []models.FollowRequest
	for rows.Next() {
		var fr models.FollowRequest
		err := rows.Scan(&fr.ID, &fr.RequesterID, &fr.TargetID, &fr.Status, &fr.CreatedAt)
		if err != nil {
			return nil, err
		}
		requests = append(requests, fr)
	}
	return requests, nil
}

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

// GetFollowRequestBetween returns the follow request between two users, if it exists.
func (s *Service) GetFollowRequestBetween(requesterID, targetID int64) (*models.FollowRequest, error) {
	row := s.DB.QueryRow(`
		SELECT id, requester_id, target_id, status, created_at
		FROM follow_requests
		WHERE requester_id = ? AND target_id = ?
	`, requesterID, targetID)
	var fr models.FollowRequest
	err := row.Scan(&fr.ID, &fr.RequesterID, &fr.TargetID, &fr.Status, &fr.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &fr, nil
}

// GetFollowers retourne la liste des utilisateurs qui suivent l'utilisateur donné (status accepted)
func (s *Service) GetFollowers(userID int64) ([]models.User, error) {
	rows, err := s.DB.Query(`
			   SELECT u.id, u.nickname, u.first_name, u.last_name, u.email, u.avatar, u.is_private
			   FROM users u
			   JOIN follow_requests f ON u.id = f.requester_id
			   WHERE f.target_id = ? AND f.status = 'accepted'`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		err := rows.Scan(&u.ID, &u.Nickname, &u.FirstName, &u.LastName, &u.Email, &u.Avatar, &u.IsPrivate)
		if err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}

// GetFollowing retourne la liste des utilisateurs suivis par l'utilisateur donné (status accepted)
func (s *Service) GetFollowing(userID int64) ([]models.User, error) {
	rows, err := s.DB.Query(`
			   SELECT u.id, u.nickname, u.first_name, u.last_name, u.email, u.avatar, u.is_private
			   FROM users u
			   JOIN follow_requests f ON u.id = f.target_id
			   WHERE f.requester_id = ? AND f.status = 'accepted'`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		err := rows.Scan(&u.ID, &u.Nickname, &u.FirstName, &u.LastName, &u.Email, &u.Avatar, &u.IsPrivate)
		if err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}

// GetMutualFriends returns users who follow the given user AND are followed back by the given user
func (s *Service) GetMutualFriends(userID int64) ([]models.User, error) {
	rows, err := s.DB.Query(`
		SELECT u.id, u.nickname, u.first_name, u.last_name, u.email, u.avatar, u.is_private
		FROM users u
		WHERE u.id IN (
			SELECT f1.requester_id
			FROM follow_requests f1
			WHERE f1.target_id = ? AND f1.status = 'accepted'
		)
		AND u.id IN (
			SELECT f2.target_id
			FROM follow_requests f2
			WHERE f2.requester_id = ? AND f2.status = 'accepted'
		)
		AND u.id != ?`, userID, userID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		err := rows.Scan(&u.ID, &u.Nickname, &u.FirstName, &u.LastName, &u.Email, &u.Avatar, &u.IsPrivate)
		if err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}
