package db

import (
	"database/sql"
	"errors"

	"github.com/Golden76z/social-network/models"
)

func (s *Service) GroupExists(groupID int64) (bool, error) {
	var exists bool
	err := s.DB.QueryRow(`SELECT EXISTS(SELECT 1 FROM groups WHERE id = ?)`, groupID).Scan(&exists)
	return exists, err
}

func (s *Service) IsUserInGroup(userID, groupID int64) (bool, error) {
	var exists bool
	err := s.DB.QueryRow(`SELECT EXISTS(SELECT 1 FROM group_members WHERE user_id = ? AND group_id = ?)`, userID, groupID).Scan(&exists)
	return exists, err
}

func (s *Service) IsUserGroupAdmin(userID, groupID int64) (bool, error) {
	var isAdmin bool
	err := s.DB.QueryRow(`SELECT EXISTS(SELECT 1 FROM groups WHERE id = ? AND admin_id = ?)`, groupID, userID).Scan(&isAdmin)
	return isAdmin, err
}

func (s *Service) IsPostOwner(userID, postID int64) (bool, error) {
	var exists bool
	err := s.DB.QueryRow(`SELECT EXISTS(SELECT 1 FROM group_posts WHERE id = ? AND user_id = ?)`, postID, userID).Scan(&exists)
	return exists, err
}

func (s *Service) CreateGroupPost(request models.CreateGroupPostRequest, userID int64) error {
	exists, err := s.GroupExists(request.GroupID)
	if err != nil {
		return err
	}
	if !exists {
		return errors.New("group does not exist")
	}

	isMember, err := s.IsUserInGroup(userID, request.GroupID)
	if err != nil {
		return err
	}
	if !isMember {
		return errors.New("user is not a member of the group")
	}

	tx, err := s.DB.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		} else {
			tx.Commit()
		}
	}()

	_, err = tx.Exec(`
		INSERT INTO group_posts (group_id, user_id, title, body)
		VALUES (?, ?, ?, ?)`, request.GroupID, userID, request.Title, request.Body)
	return err
}

func (s *Service) GetGroupPostsWithImagesByGroupID(groupID int64, offset int, userID int64) ([]*models.GroupPost, error) {
	// Checking if the group id is valid
	exists, err := s.GroupExists(groupID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, errors.New("group does not exist")
	}

	// Checking if the user making the request is part of the group
	isMember, err := s.IsUserInGroup(userID, groupID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, errors.New("user is not a member of the group")
	}

	// Beginning of the transaction
	tx, err := s.DB.Begin()
	if err != nil {
		return nil, err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		} else {
			tx.Commit()
		}
	}()

	rows, err := tx.Query(`
		SELECT id, user_id, title, body, created_at, updated_at
		FROM group_posts
		WHERE group_id = ?
		ORDER BY created_at DESC
		LIMIT -1 OFFSET (
			SELECT CASE 
				WHEN COUNT(*) <= ? THEN 0 
				ELSE ? 
			END
			FROM group_posts
			WHERE group_id = ?
		)
	`, groupID, offset, offset, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// Ranging over the group post
	var posts []*models.GroupPost
	for rows.Next() {
		var gp models.GroupPost
		err = rows.Scan(&gp.ID, &gp.UserID, &gp.Title, &gp.Body, &gp.CreatedAt, &gp.UpdatedAt)
		if err != nil {
			return nil, err
		}
		gp.Visibility = "public"
		imageRows, err := tx.Query(`
			SELECT image_url FROM post_images
			WHERE post_id = ? AND is_group_post = 1`, gp.ID)
		if err != nil {
			return nil, err
		}

		// Ranging over the images of the post
		var images []string
		for imageRows.Next() {
			var url string
			if err = imageRows.Scan(&url); err != nil {
				imageRows.Close()
				return nil, err
			}
			images = append(images, url)
		}
		imageRows.Close()
		gp.Images = images
		posts = append(posts, &gp)
	}
	return posts, nil
}

func (s *Service) GetGroupPostWithImagesByID(postID, userID int64) (*models.GroupPost, error) {
	// Retrieve group_id from post to verify access
	groupID, err := s.GetGroupIDFromPost(postID)
	if err != nil {

	}

	// Check if user is a member of the group
	isMember, err := s.IsUserInGroup(userID, groupID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, errors.New("user is not a member of the group")
	}

	// Get post details
	var gp models.GroupPost
	err = s.DB.QueryRow(`
        SELECT id, user_id, title, body, created_at, updated_at
        FROM group_posts
        WHERE id = ?`, postID).Scan(&gp.ID, &gp.UserID, &gp.Title, &gp.Body, &gp.CreatedAt, &gp.UpdatedAt)
	if err != nil {
		return nil, err
	}
	gp.Visibility = "public"

	// Get post images
	rows, err := s.DB.Query(`
        SELECT image_url FROM post_images
        WHERE post_id = ? AND is_group_post = 1`, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var images []string
	for rows.Next() {
		var url string
		if err := rows.Scan(&url); err != nil {
			return nil, err
		}
		images = append(images, url)
	}
	gp.Images = images

	return &gp, nil
}

func (s *Service) UpdateGroupPost(request models.UpdateGroupPostRequest, userID int64) error {
	// groupID, err := s.GetGroupIDFromPost(request.ID)
	// if err != nil {
	// 	return errors.New("post not found")
	// }

	// Checking if the user is the owner of the Post
	isOwner, err := s.IsPostOwner(userID, request.ID)
	if err != nil {
		return err
	}

	// isAdmin, err := s.IsUserGroupAdmin(userID, groupID)
	// if err != nil {
	// 	return err
	// }
	if !isOwner {
		return errors.New("not authorized")
	}

	tx, err := s.DB.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		} else {
			tx.Commit()
		}
	}()

	query := "UPDATE group_posts SET updated_at = CURRENT_TIMESTAMP"
	args := []any{}

	if request.Title != nil {
		query += ", title = ?"
		args = append(args, *request.Title)
	}

	if request.Body != nil {
		query += ", body = ?"
		args = append(args, *request.Body)
	}

	query += " WHERE id = ?"
	args = append(args, request.ID)

	_, err = tx.Exec(query, args...)
	return err
}

func (s *Service) DeleteGroupPost(id int64, userID int64) error {
	// groupID, err := s.GetGroupIDFromPost(id)
	// if err != nil {
	// 	return errors.New("post not found")
	// }

	// Checking if the user is the owner of the Post
	isOwner, err := s.IsPostOwner(userID, id)
	if err != nil {
		return err
	}

	// isAdmin, err := s.IsUserGroupAdmin(userID, groupID)
	// if err != nil {
	// 	return err
	// }
	if !isOwner {
		return errors.New("not authorized")
	}

	tx, err := s.DB.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		} else {
			tx.Commit()
		}
	}()

	_, err = tx.Exec(`DELETE FROM group_posts WHERE id = ?`, id)
	return err
}

func (s *Service) GetGroupIDFromPost(postID int64) (int64, error) {
	var groupID int64
	err := s.DB.QueryRow(`SELECT group_id FROM group_posts WHERE id = ?`, postID).Scan(&groupID)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, errors.New("post not found")
		}
		return 0, err
	}
	return groupID, nil
}
