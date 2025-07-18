package db

import (
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

func (s *Service) CreateLikeDislike(request models.CreateReactionRequest) error {
	tx, err := s.DB.Begin()
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

func (s *Service) GetLikeDislikeByID(id int64) (*models.ReactionResponse, error) {
	row := s.DB.QueryRow(`
        SELECT id, user_id, post_id, comment_id, group_post_id, group_comment_id, type, created_at
        FROM likes_dislikes WHERE id = ?`, id)
	var ld models.ReactionResponse
	err := row.Scan(&ld.ID, &ld.UserID, &ld.PostID, &ld.CommentID, &ld.GroupPostID, &ld.GroupCommentID, &ld.Type, &ld.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &ld, nil
}

func (s *Service) UpdateLikeDislike(id int64, request models.UpdateReactionRequest) error {
	tx, err := s.DB.Begin()
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

func (s *Service) DeleteLikeDislike(id int64) error {
	tx, err := s.DB.Begin()
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
