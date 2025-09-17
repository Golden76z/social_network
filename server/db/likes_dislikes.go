package db

import (
	"github.com/Golden76z/social-network/models"
)

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

// UserReactionExists checks if a reaction already exists for a user and a given target (post, comment, group post, group comment)
func (s *Service) UserReactionExists(userID int64, postID, commentID, groupPostID, groupCommentID *int64) (bool, error) {
	var count int
	err := s.DB.QueryRow(`
	SELECT COUNT(*) FROM likes_dislikes
	WHERE user_id = ?
	  AND (
		(post_id = ? AND comment_id IS NULL AND group_post_id IS NULL AND group_comment_id IS NULL)
		OR (comment_id = ? AND post_id IS NULL AND group_post_id IS NULL AND group_comment_id IS NULL)
		OR (group_post_id = ? AND post_id IS NULL AND comment_id IS NULL AND group_comment_id IS NULL)
		OR (group_comment_id = ? AND post_id IS NULL AND comment_id IS NULL AND group_post_id IS NULL)
	  )
`, userID, postID, commentID, groupPostID, groupCommentID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// GetUserReactionID gets the reaction ID for a user and a given target (post, comment, group post, group comment)
func (s *Service) GetUserReactionID(userID int64, postID, commentID, groupPostID, groupCommentID *int64) (*models.ReactionResponse, error) {
	row := s.DB.QueryRow(`
	SELECT id, user_id, post_id, comment_id, group_post_id, group_comment_id, type, created_at
	FROM likes_dislikes
	WHERE user_id = ?
	  AND (
		(post_id = ? AND comment_id IS NULL AND group_post_id IS NULL AND group_comment_id IS NULL)
		OR (comment_id = ? AND post_id IS NULL AND group_post_id IS NULL AND group_comment_id IS NULL)
		OR (group_post_id = ? AND post_id IS NULL AND comment_id IS NULL AND group_comment_id IS NULL)
		OR (group_comment_id = ? AND post_id IS NULL AND comment_id IS NULL AND group_post_id IS NULL)
	  )
`, userID, postID, commentID, groupPostID, groupCommentID)

	var reaction models.ReactionResponse
	err := row.Scan(&reaction.ID, &reaction.UserID, &reaction.PostID, &reaction.CommentID, &reaction.GroupPostID, &reaction.GroupCommentID, &reaction.Type, &reaction.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &reaction, nil
}
