package db

import (
	"database/sql"

	"github.com/Golden76z/social-network/models"
)

// LikeDislike represents a like/dislike in the database
type LikeDislike struct {
	ID             int64  `json:"id"`
	UserID         int64  `json:"user_id"`
	PostID         *int64 `json:"post_id,omitempty"`
	CommentID      *int64 `json:"comment_id,omitempty"`
	GroupPostID    *int64 `json:"group_post_id,omitempty"`
	GroupCommentID *int64 `json:"group_comment_id,omitempty"`
	Type           string `json:"type"`
	CreatedAt      string `json:"created_at"`
}

func CreateLikeDislike(db *sql.DB, request models.CreateReactionRequest) error {
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
        INSERT INTO likes_dislikes (user_id, post_id, comment_id, group_post_id, group_comment_id, type)
        VALUES (?, ?, ?, ?, ?, ?)`, request.UserID, request.PostID, request.CommentID, request.GroupPostID, request.GroupCommentID, request.Type)
	return err
}

func GetLikeDislikeByID(db *sql.DB, id int64) (*models.ReactionResponse, error) {
	row := db.QueryRow(`
        SELECT id, user_id, post_id, comment_id, group_post_id, group_comment_id, type, created_at
        FROM likes_dislikes WHERE id = ?`, id)
	var ld models.ReactionResponse
	err := row.Scan(&ld.ID, &ld.UserID, &ld.PostID, &ld.CommentID, &ld.GroupPostID, &ld.GroupCommentID, &ld.Type, &ld.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &ld, nil
}

func UpdateLikeDislike(db *sql.DB, id int64, request models.UpdateReactionRequest) error {
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
	_, err = tx.Exec(`UPDATE likes_dislikes SET type = ? WHERE id = ?`, request.Type, id)
	return err
}

func DeleteLikeDislike(db *sql.DB, id int64) error {
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
	_, err = tx.Exec(`DELETE FROM likes_dislikes WHERE id = ?`, id)
	return err
}
