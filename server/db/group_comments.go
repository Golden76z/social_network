package db

import (
	"database/sql"

	"github.com/Golden76z/social-network/models"
)

func CreateGroupComment(db *sql.DB, request models.CreateGroupCommentRequest, userID int64) error {
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
        VALUES (?, ?, ?, ?)`, request.GroupPostID, userID, request.Body, request.Image)
	return err
}

func GetGroupCommentByID(db *sql.DB, id int64) (*models.Comment, error) {
	row := db.QueryRow(`
        SELECT id, group_post_id, user_id, body, created_at, updated_at
        FROM group_comments WHERE id = ?`, id)
	var gc models.Comment
	err := row.Scan(&gc.ID, &gc.PostID, &gc.UserID, &gc.Body, &gc.CreatedAt, &gc.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &gc, nil
}

func UpdateGroupComment(db *sql.DB, id int64, request models.UpdateGroupCommentRequest) error {
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

	// Build dynamic update query
	query := "UPDATE group_comments SET updated_at = CURRENT_TIMESTAMP"
	args := []interface{}{}

	if request.Body != nil {
		query += ", body = ?"
		args = append(args, *request.Body)
	}

	if request.Image != nil {
		query += ", image = ?"
		args = append(args, *request.Image)
	}

	query += " WHERE id = ?"
	args = append(args, id)

	_, err = tx.Exec(query, args...)
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
