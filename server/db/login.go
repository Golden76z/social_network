package db

import (
	"database/sql"
	"errors"
	"net/http"

	"golang.org/x/crypto/bcrypt"
)

func (s *Service) LoginDB(username, password string, w http.ResponseWriter) error {
	tx, err := s.DB.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		} else {
			_ = tx.Commit()
		}
	}()

	var hashedPassword string
	query := `SELECT password FROM users WHERE nickname = ? OR email = ?`
	err = tx.QueryRow(query, username, username).Scan(&hashedPassword)
	if err == sql.ErrNoRows {
		http.Error(w, "User not found. Please check your email/nickname and try again", http.StatusUnauthorized)
		return errors.New("invalid credentials")
	} else if err != nil {
		return err
	}

	if err = bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password)); err != nil {
		http.Error(w, "Invalid password. Please check your password and try again", http.StatusUnauthorized)
		return errors.New("invalid credentials")
	}

	return nil
}
