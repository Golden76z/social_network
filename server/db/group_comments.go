package db

import (
	"database/sql"

	"github.com/Golden76z/social-network/models"
)

func CreateGroupComment(db *sql.DB, groupPostID, userID int64, body, image string) error {
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
        INSERT INTO group_comments (group_post_id, user_id, body, image)
        VALUES (?, ?, ?, ?)`, groupPostID, userID, body, image)
	return err
}

func GetGroupCommentByID(db *sql.DB, id int64) (*models.GroupComment, error) {
	row := db.QueryRow(`
        SELECT id, group_post_id, user_id, body, image, created_at, updated_at
        FROM group_comments WHERE id = ?`, id)
	var gc models.GroupComment
	err := row.Scan(&gc.ID, &gc.GroupPostID, &gc.UserID, &gc.Body, &gc.Image, &gc.CreatedAt, &gc.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &gc, nil
}

func UpdateGroupComment(db *sql.DB, id int64, body, image string) error {
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
        UPDATE group_comments SET body = ?, image = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`, body, image, id)
	return err
}

func DeleteGroupComment(db *sql.DB, id int64) error {
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
	_, err = tx.Exec(`DELETE FROM group_comments WHERE id = ?`, id)
	return err
}
