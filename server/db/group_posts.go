package db

import (
	"database/sql"

	"github.com/Golden76z/social-network/models"
)

func CreateGroupPost(db *sql.DB, groupID, userID int64, title, body, image string) error {
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
        INSERT INTO group_posts (group_id, user_id, title, body, image)
        VALUES (?, ?, ?, ?, ?)`, groupID, userID, title, body, image)
	return err
}

func GetGroupPostByID(db *sql.DB, id int64) (*models.GroupPost, error) {
	row := db.QueryRow(`
        SELECT id, group_id, user_id, title, body, image, created_at, updated_at
        FROM group_posts WHERE id = ?`, id)
	var gp models.GroupPost
	err := row.Scan(&gp.ID, &gp.GroupID, &gp.UserID, &gp.Title, &gp.Body, &gp.Image, &gp.CreatedAt, &gp.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &gp, nil
}

func UpdateGroupPost(db *sql.DB, id int64, title, body, image string) error {
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
        UPDATE group_posts SET title = ?, body = ?, image = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`, title, body, image, id)
	return err
}

func DeleteGroupPost(db *sql.DB, id int64) error {
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
	_, err = tx.Exec(`DELETE FROM group_posts WHERE id = ?`, id)
	return err
}
