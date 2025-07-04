package db

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/Golden76z/social-network/models"
)

func CreateUser(db *sql.DB, req models.User) error {
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
		req.Nickname, req.FirstName, req.LastName, req.Email, req.Password, req.DateOfBirth, req.Avatar, req.Bio, req.IsPrivate)
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

func UpdateUser(db *sql.DB, userID int64, req models.UpdateUserProfileRequest) error {
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

	var setParts []string
	var args []interface{}

	if req.Nickname != nil {
		setParts = append(setParts, "nickname = ?")
		args = append(args, *req.Nickname)
	}
	if req.FirstName != nil {
		setParts = append(setParts, "first_name = ?")
		args = append(args, *req.FirstName)
	}
	if req.LastName != nil {
		setParts = append(setParts, "last_name = ?")
		args = append(args, *req.LastName)
	}
	if req.Email != nil {
		setParts = append(setParts, "email = ?")
		args = append(args, *req.Email)
	}
	if req.DateOfBirth != nil {
		setParts = append(setParts, "date_of_birth = ?")
		args = append(args, *req.DateOfBirth)
	}
	if req.Avatar != nil {
		setParts = append(setParts, "avatar = ?")
		args = append(args, *req.Avatar)
	}
	if req.Bio != nil {
		setParts = append(setParts, "bio = ?")
		args = append(args, *req.Bio)
	}
	if req.IsPrivate != nil {
		setParts = append(setParts, "is_private = ?")
		args = append(args, *req.IsPrivate)
	}

	if len(setParts) == 0 {
		return fmt.Errorf("no fields to update")
	}

	query := fmt.Sprintf("UPDATE users SET %s WHERE id = ?", strings.Join(setParts, ", "))
	args = append(args, userID)

	_, err = tx.Exec(query, args...)
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
