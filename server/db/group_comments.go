package db

import (
	"database/sql"
	"errors"

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

// GetGroupComments retrieves all comments for a specific group post
func (s *Service) GetGroupComments(groupPostID, userID int64) ([]models.Comment, error) {
	// First verify if user has access to this group post
	hasAccess, err := s.CanUserAccessGroupPost(groupPostID, userID)
	if err != nil {
		return nil, err
	}
	if !hasAccess {
		return nil, errors.New("unauthorized: user cannot access this group post")
	}

	rows, err := s.DB.Query(`
		SELECT gc.id, gc.group_post_id, gc.user_id, gc.body, gc.created_at, gc.updated_at,
			   u.username, u.first_name, u.last_name, u.avatar
		FROM group_comments gc
		JOIN users u ON gc.user_id = u.id
		WHERE gc.group_post_id = ?
		ORDER BY gc.created_at ASC`, groupPostID)
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

		// Add user info to comment
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
	row := s.DB.QueryRow(`
		SELECT user_id FROM group_comments WHERE id = ?`, commentID)

	err := row.Scan(&ownerID)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, errors.New("comment not found")
		}
		return false, err
	}

	return ownerID == userID, nil
}

// CanUserAccessGroupPost checks if user can access a group post (member of the group)
func (s *Service) CanUserAccessGroupPost(groupPostID, userID int64) (bool, error) {
	var count int
	row := s.DB.QueryRow(`
		SELECT COUNT(*) FROM group_posts gp
		JOIN group_members gm ON gp.group_id = gm.group_id
		WHERE gp.id = ? AND gm.user_id = ? AND gm.status = 'accepted'`, groupPostID, userID)

	err := row.Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

// UpdateGroupComment updates a comment with authorization check
func (s *Service) UpdateGroupComment(commentID, userID int64, request models.UpdateGroupCommentRequest) error {
	// First check if user owns the comment
	isOwner, err := s.IsGroupCommentOwner(commentID, userID)
	if err != nil {
		return err
	}
	if !isOwner {
		return errors.New("unauthorized: user is not the owner of this comment")
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

	// Build dynamic update query
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

// DeleteGroupComment deletes a comment with authorization check
func (s *Service) DeleteGroupComment(commentID, userID int64) error {
	// First check if user owns the comment
	isOwner, err := s.IsGroupCommentOwner(commentID, userID)
	if err != nil {
		return err
	}
	if !isOwner {
		return errors.New("unauthorized: user is not the owner of this comment")
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

// GetGroupCommentWithUserDetails gets a single comment with user details
func (s *Service) GetGroupCommentWithUserDetails(commentID, requestingUserID int64) (*models.Comment, error) {
	row := s.DB.QueryRow(`
		SELECT gc.id, gc.group_post_id, gc.user_id, gc.body, gc.created_at, gc.updated_at,
			   u.username, u.first_name, u.last_name, u.avatar
		FROM group_comments gc
		JOIN users u ON gc.user_id = u.id
		WHERE gc.id = ?`, commentID)

	var comment models.Comment
	var username, firstName, lastName sql.NullString
	var avatar sql.NullString

	err := row.Scan(&comment.ID, &comment.PostID, &comment.UserID, &comment.Body,
		&comment.CreatedAt, &comment.UpdatedAt, &username, &firstName, &lastName, &avatar)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("comment not found")
		}
		return nil, err
	}

	// Verify user can access this comment (member of the group)
	hasAccess, err := s.CanUserAccessGroupPost(comment.PostID, requestingUserID)
	if err != nil {
		return nil, err
	}
	if !hasAccess {
		return nil, errors.New("unauthorized: user cannot access this comment")
	}

	// Add user info to comment
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
