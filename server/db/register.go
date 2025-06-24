package db

import (
	"errors"
	"net/http"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// RegisterDB handles inserting a new user into the database using a transaction
func (s *Service) RegisterDB(
	nickname, firstName, lastName, email, password, dob string,
	w http.ResponseWriter,
) (err error) {
	tx, err := s.DB.Begin()
	if err != nil {
		return err
	}

	// Ensure transaction is rolled back on error
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		} else {
			err = tx.Commit()
		}
	}()

	// Check if an user already exist with the given informations
	var exists int
	err = tx.QueryRow(`
		SELECT COUNT(*) FROM users WHERE nickname = ? OR email = ?
	`, nickname, email).Scan(&exists)

	if err != nil {
		return err
	}

	if exists > 0 {
		return errors.New("nickname or email already exists")
	}

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	// Parse date
	dateOfBirth, err := time.Parse("2006-01-02", dob)
	if err != nil {
		return errors.New("invalid date format, expected YYYY-MM-DD")
	}

	// Insert user into the database
	_, err = tx.Exec(`
		INSERT INTO users (
			nickname, first_name, last_name, email, password, date_of_birth
		) VALUES (?, ?, ?, ?, ?, ?)
	`, nickname, firstName, lastName, email, string(hashedPassword), dateOfBirth)
	if err != nil {
		return err
	}

	// Return nil if the insertion into the database was successful
	return nil
}
