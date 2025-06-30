package db

import (
	"errors"
	"time"
)

func (s *Service) CreateSession(userID int, token string, tokenLifetime time.Duration) error {
	if s.DB == nil {
		return errors.New("nil database connection")
	}

	// Generate token (you can replace this with your JWT generation)
	expiresAt := time.Now().Add(tokenLifetime)

	// Insert into database
	_, err := s.DB.Exec(`
		INSERT INTO sessions (token, user_id, expires_at)
		VALUES (?, ?, ?)`,
		token,
		userID,
		expiresAt,
	)

	if err != nil {
		return err
	}

	return nil
}
