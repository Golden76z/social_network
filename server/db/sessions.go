package db

import (
	"errors"
	"time"
)

func (s *Service) CreateSession(userID int, token string, tokenLifetime time.Duration) error {
	if s.DB == nil {
		return errors.New("nil database connection")
	}

	// Use transaction to prevent database locks
	tx, err := s.DB.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// Generate token (you can replace this with your JWT generation)
	expiresAt := time.Now().Add(tokenLifetime)

	// First, delete any existing sessions for this user to prevent duplicates
	_, err = tx.Exec("DELETE FROM sessions WHERE user_id = ?", userID)
	if err != nil {
		return err
	}

	// Insert into database
	_, err = tx.Exec(`
		INSERT INTO sessions (token, user_id, expires_at)
		VALUES (?, ?, ?)`,
		token,
		userID,
		expiresAt,
	)

	if err != nil {
		return err
	}

	return tx.Commit()
}

// VerifyAndDeleteSession checks if session exists and deletes it
func (s *Service) VerifyAndDeleteSession(token string) error {
	tx, err := s.DB.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// 1. Verify session exists and is active
	var exists bool
	err = tx.QueryRow(`
        SELECT EXISTS(
            SELECT 1 FROM sessions 
            WHERE token = ? AND expires_at > ?
        )`, token, time.Now()).Scan(&exists)

	if err != nil {
		return err
	}
	if !exists {
		return errors.New("session not found or expired")
	}

	// 2. Delete session
	_, err = tx.Exec("DELETE FROM sessions WHERE token = ?", token)
	if err != nil {
		return err
	}

	return tx.Commit()
}
