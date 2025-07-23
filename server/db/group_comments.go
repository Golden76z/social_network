package db

import (
	"database/sql"
	"errors"

	"github.com/Golden76z/social-network/models"
)

// Method to insert a comment on a group post
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

	// Insert comment only if user is an accepted member of the group
	res, err := tx.Exec(`
		INSERT INTO group_comments (group_post_id, user_id, body)
		SELECT ?, ?, ?
		FROM group_posts gp
		JOIN group_members gm ON gp.group_id = gm.group_id
		WHERE gp.id = ? AND gm.user_id = ? AND gm.status = 'accepted'
	`, request.GroupPostID, userID, request.Body, request.GroupPostID, userID)
	if err != nil {
		return err
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return errors.New("unauthorized: user is not an accepted member of the group or post does not exist")
	}

	return nil
}

// Method to retrieve a single comment with its ID (access check included)
func (s *Service) GetGroupCommentByID(id, userID int64) (*models.Comment, error) {
	row := s.DB.QueryRow(`
		SELECT gc.id, gc.group_post_id, gc.user_id, gc.body, gc.created_at, gc.updated_at
		FROM group_comments gc
		JOIN group_posts gp ON gc.group_post_id = gp.id
		JOIN group_members gm ON gp.group_id = gm.group_id
		WHERE gc.id = ? AND gm.user_id = ? AND gm.status = 'accepted'
	`, id, userID)

	var gc models.Comment
	err := row.Scan(&gc.ID, &gc.PostID, &gc.UserID, &gc.Body, &gc.CreatedAt, &gc.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("comment not found or access denied")
		}
		return nil, err
	}
	return &gc, nil
}

func (s *Service) GetGroupComments(groupPostID, userID int64, offset int) ([]models.Comment, error) {
	rows, err := s.DB.Query(`
		SELECT gc.id, gc.group_post_id, gc.user_id, gc.body, gc.created_at, gc.updated_at,
			   u.nickname, u.first_name, u.last_name, u.avatar
		FROM group_comments gc
		JOIN users u ON gc.user_id = u.id
		JOIN group_posts gp ON gc.group_post_id = gp.id
		JOIN group_members gm ON gp.group_id = gm.group_id
		WHERE gc.group_post_id = ? AND gm.user_id = ? AND gm.status = 'accepted'
		ORDER BY gc.created_at ASC
		LIMIT -1 OFFSET (
			SELECT CASE
				WHEN COUNT(*) <= ? THEN 0
				ELSE ?
			END
			FROM group_comments
			WHERE group_post_id = ?
		)
	`, groupPostID, userID, offset, offset, groupPostID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []models.Comment
	for rows.Next() {
		var comment models.Comment
		var username, firstName, lastName sql.NullString
		var avatar sql.NullString

		err := rows.Scan(&comment.ID, &comment.PostID, &comment.UserID, &comment.Body,
			&comment.CreatedAt, &comment.UpdatedAt, &username, &firstName, &lastName, &avatar)
		if err != nil {
			return nil, err
		}

		if username.Valid {
			comment.Username = username.String
		}
		if firstName.Valid {
			comment.FirstName = firstName.String
		}
		if lastName.Valid {
			comment.LastName = lastName.String
		}
		if avatar.Valid {
			comment.Avatar = avatar.String
		}

		comments = append(comments, comment)
	}

	return comments, rows.Err()
}

// IsGroupCommentOwner checks if the user is the owner of the comment
func (s *Service) IsGroupCommentOwner(commentID, userID int64) (bool, error) {
	var ownerID int64
	row := s.DB.QueryRow(`SELECT user_id FROM group_comments WHERE id = ?`, commentID)

	err := row.Scan(&ownerID)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, errors.New("comment not found")
		}
		return false, err
	}
	return ownerID == userID, nil
}

// UpdateGroupComment updates a comment with authorization and access check
func (s *Service) UpdateGroupComment(commentID, userID int64, request models.UpdateGroupCommentRequest) error {
	// First check if user owns the comment
	isOwner, err := s.IsGroupCommentOwner(commentID, userID)
	if err != nil {
		return err
	}
	if !isOwner {
		return errors.New("unauthorized: user is not the owner of this comment")
	}

	// Check if user still has access to the group
	var count int
	err = s.DB.QueryRow(`
		SELECT COUNT(*) FROM group_comments gc
		JOIN group_posts gp ON gc.group_post_id = gp.id
		JOIN group_members gm ON gp.group_id = gm.group_id
		WHERE gc.id = ? AND gm.user_id = ? AND gm.status = 'accepted'
	`, commentID, userID).Scan(&count)
	if err != nil {
		return err
	}
	if count == 0 {
		return errors.New("unauthorized: access to the group has been revoked")
	}

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

	query := "UPDATE group_comments SET updated_at = CURRENT_TIMESTAMP"
	args := []any{}

	if request.Body != nil {
		query += ", body = ?"
		args = append(args, *request.Body)
	}

	query += " WHERE id = ?"
	args = append(args, commentID)

	result, err := tx.Exec(query, args...)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return errors.New("comment not found")
	}

	return nil
}

// DeleteGroupComment deletes a comment with authorization and access check
func (s *Service) DeleteGroupComment(commentID, userID int64) error {
	// First check if user owns the comment
	isOwner, err := s.IsGroupCommentOwner(commentID, userID)
	if err != nil {
		return err
	}
	if !isOwner {
		return errors.New("unauthorized: user is not the owner of this comment")
	}

	// Check if user still has access to the group
	var count int
	err = s.DB.QueryRow(`
		SELECT COUNT(*) FROM group_comments gc
		JOIN group_posts gp ON gc.group_post_id = gp.id
		JOIN group_members gm ON gp.group_id = gm.group_id
		WHERE gc.id = ? AND gm.user_id = ? AND gm.status = 'accepted'
	`, commentID, userID).Scan(&count)
	if err != nil {
		return err
	}
	if count == 0 {
		return errors.New("unauthorized: access to the group has been revoked")
	}

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

	result, err := tx.Exec(`DELETE FROM group_comments WHERE id = ?`, commentID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return errors.New("comment not found")
	}

	return nil
}

// GetGroupCommentWithUserDetails retrieves a comment and user info with access control
func (s *Service) GetGroupCommentWithUserDetails(commentID, userID int64) (*models.Comment, error) {
	row := s.DB.QueryRow(`
		SELECT gc.id, gc.group_post_id, gc.user_id, gc.body, gc.created_at, gc.updated_at,
			   u.username, u.first_name, u.last_name, u.avatar
		FROM group_comments gc
		JOIN users u ON gc.user_id = u.id
		JOIN group_posts gp ON gc.group_post_id = gp.id
		JOIN group_members gm ON gp.group_id = gm.group_id
		WHERE gc.id = ? AND gm.user_id = ? AND gm.status = 'accepted'
	`, commentID, userID)

	var comment models.Comment
	var username, firstName, lastName sql.NullString
	var avatar sql.NullString

	err := row.Scan(&comment.ID, &comment.PostID, &comment.UserID, &comment.Body,
		&comment.CreatedAt, &comment.UpdatedAt, &username, &firstName, &lastName, &avatar)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("comment not found or access denied")
		}
		return nil, err
	}

	if username.Valid {
		comment.Username = username.String
	}
	if firstName.Valid {
		comment.FirstName = firstName.String
	}
	if lastName.Valid {
		comment.LastName = lastName.String
	}
	if avatar.Valid {
		comment.Avatar = avatar.String
	}

	return &comment, nil
}
