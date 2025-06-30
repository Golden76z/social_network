package db

import (
	"database/sql"
	"fmt"

	"github.com/Golden76z/social-network/models"
)

func CreateUser(db *sql.DB, nickname, firstName, lastName, email, password, dateOfBirth, avatar, bio string, isPrivate bool) error {
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
        INSERT INTO users (nickname, first_name, last_name, email, password, date_of_birth, avatar, bio, is_private)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		nickname, firstName, lastName, email, password, dateOfBirth, avatar, bio, isPrivate)
	return err
}

func GetUserByEmail(db *sql.DB, email string) (*models.User, error) {
	row := db.QueryRow(`
        SELECT id, nickname, first_name, last_name, email, password, date_of_birth, avatar, bio, is_private
        FROM users WHERE email = ?`, email)

	var user models.User
	err := row.Scan(
		&user.ID,
		&user.Nickname,
		&user.FirstName,
		&user.LastName,
		&user.Email,
		&user.Password,
		&user.DateOfBirth,
		&user.Avatar,
		&user.Bio,
		&user.IsPrivate,
	)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetUserIDByIdentifier retrieves a user's ID by either nickname or email
func GetUserIDByUsername(db *sql.DB, identifier string) (int64, error) {
	var userID int64

	// Single query that checks both nickname and email
	err := db.QueryRow(`
        SELECT id 
        FROM users 
        WHERE nickname = ? OR email = ? 
        LIMIT 1`,
		identifier, identifier,
	).Scan(&userID)

	if err != nil {
		if err == sql.ErrNoRows {
			return 0, fmt.Errorf("user not found")
		}
		return 0, fmt.Errorf("database error: %w", err)
	}

	return userID, nil
}

func UpdateUser(db *sql.DB, user *models.User) error {
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
        UPDATE users SET
            nickname = ?,
            first_name = ?,
            last_name = ?,
            email = ?,
            date_of_birth = ?,
            avatar = ?,
            bio = ?,
            is_private = ?
        WHERE id = ?`,
		user.Nickname, user.FirstName, user.LastName, user.Email, user.DateOfBirth, user.Avatar, user.Bio, user.IsPrivate, user.ID)
	return err
}

func DeleteUser(db *sql.DB, userID int64) error {
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
	_, err = tx.Exec(`DELETE FROM users WHERE id = ?`, userID)
	return err
}
