package db

import (
	"github.com/Golden76z/social-network/models"
)

func (s *Service) CreateGroupComment(request models.CreateGroupCommentRequest, userID int64) error {
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
        INSERT INTO group_comments (group_post_id, user_id, body)
        VALUES (?, ?, ?)`, request.GroupPostID, userID, request.Body)
	return err
}

func (s *Service) GetGroupCommentByID(id int64) (*models.Comment, error) {
	row := s.DB.QueryRow(`
        SELECT id, group_post_id, user_id, body, created_at, updated_at
        FROM group_comments WHERE id = ?`, id)
	var gc models.Comment
	err := row.Scan(&gc.ID, &gc.PostID, &gc.UserID, &gc.Body, &gc.CreatedAt, &gc.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &gc, nil
}

func (s *Service) UpdateGroupComment(id int64, request models.UpdateGroupCommentRequest) error {
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

	// Build dynamic update query
	query := "UPDATE group_comments SET updated_at = CURRENT_TIMESTAMP"
	args := []interface{}{}

	if request.Body != nil {
		query += ", body = ?"
		args = append(args, *request.Body)
	}

	query += " WHERE id = ?"
	args = append(args, id)

	_, err = tx.Exec(query, args...)
	return err
}

func (s *Service) DeleteGroupComment(id int64) error {
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
	_, err = tx.Exec(`DELETE FROM group_comments WHERE id = ?`, id)
	return err
}
