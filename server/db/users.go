package db

import (
	"database/sql"

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
	err := row.Scan(&user.ID, &user.Nickname, &user.FirstName, &user.LastName, &user.Email, &user.Password, &user.DateOfBirth, &user.Avatar, &user.Bio, &user.IsPrivate)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func UpdateUserBio(db *sql.DB, userID int64, newBio string) error {
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
	_, err = tx.Exec(`UPDATE users SET bio = ? WHERE id = ?`, newBio, userID)
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
