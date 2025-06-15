package db

import (
	"database/sql"

	"github.com/Golden76z/social-network/models"
)

func CreateComment(db *sql.DB, postID, userID int64, body string) error {
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
        INSERT INTO comments (post_id, user_id, body)
        VALUES (?, ?, ?)`,
		postID, userID, body)
	return err
}

func GetCommentByID(db *sql.DB, commentID int64) (*models.Comment, error) {
	row := db.QueryRow(`
        SELECT id, post_id, user_id, body, created_at, updated_at
        FROM comments WHERE id = ?`, commentID)
	var comment models.Comment
	err := row.Scan(&comment.ID, &comment.PostID, &comment.UserID, &comment.Body, &comment.CreatedAt, &comment.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &comment, nil
}

func UpdateComment(db *sql.DB, commentID int64, body string) error {
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
        UPDATE comments SET body = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
		body, commentID)
	return err
}

func DeleteComment(db *sql.DB, commentID int64) error {
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
	_, err = tx.Exec(`DELETE FROM comments WHERE id = ?`, commentID)
	return err
}
