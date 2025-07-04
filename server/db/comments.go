package db

import (
	"database/sql"
	"fmt"

	"github.com/Golden76z/social-network/models"
)

func CreateComment(db *sql.DB, req models.CreateCommentRequest) error {
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
		req.PostID, req.UserID, req.Body)
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

func UpdateComment(db *sql.DB, commentID int64, req models.UpdateCommentRequest) error {
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

	if req.Body == nil {
		return fmt.Errorf("no fields to update")
	}

	_, err = tx.Exec(`
        UPDATE comments SET body = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
		*req.Body, commentID)
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
