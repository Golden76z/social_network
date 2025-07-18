package db

import (
	"github.com/Golden76z/social-network/models"
)

func (s *Service) CreateGroupPost(request models.CreateGroupPostRequest, userID int64) error {
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
        INSERT INTO group_posts (group_id, user_id, title, body)
        VALUES (?, ?, ?, ?)`, request.GroupID, userID, request.Title, request.Body)
	return err
}

func (s *Service) GetGroupPostWithImagesByID(id int64) (*models.GroupPost, error) {
	tx, err := s.DB.Begin()
	if err != nil {
		return nil, err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		} else {
			_ = tx.Commit()
		}
	}()

	row := tx.QueryRow(`
        SELECT id, user_id, title, body, created_at, updated_at
        FROM group_posts WHERE id = ?`, id)

	var gp models.GroupPost
	err = row.Scan(&gp.ID, &gp.UserID, &gp.Title, &gp.Body, &gp.CreatedAt, &gp.UpdatedAt)
	if err != nil {
		return nil, err
	}
	gp.Visibility = "public"

	imageRows, err := tx.Query(`
        SELECT image_url FROM post_images
        WHERE post_id = ? AND is_group_post = 1`, id)
	if err != nil {
		return nil, err
	}
	defer imageRows.Close()

	var images []string
	for imageRows.Next() {
		var url string
		if scanErr := imageRows.Scan(&url); scanErr != nil {
			return nil, scanErr
		}
		images = append(images, url)
	}
	gp.Images = images

	return &gp, nil
}

func (s *Service) GetGroupPostsWithImagesPaginated(offset int) ([]*models.GroupPost, error) {
	tx, err := s.DB.Begin()
	if err != nil {
		return nil, err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		} else {
			_ = tx.Commit()
		}
	}()

	postRows, err := tx.Query(`
        SELECT id, user_id, title, body, created_at, updated_at
        FROM group_posts
        ORDER BY created_at DESC
        LIMIT 20 OFFSET ?`, offset)
	if err != nil {
		return nil, err
	}
	defer postRows.Close()

	var posts []*models.GroupPost
	for postRows.Next() {
		var gp models.GroupPost
		err := postRows.Scan(&gp.ID, &gp.UserID, &gp.Title, &gp.Body, &gp.CreatedAt, &gp.UpdatedAt)
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

		var images []string
		for imageRows.Next() {
			var url string
			if scanErr := imageRows.Scan(&url); scanErr != nil {
				imageRows.Close()
				return nil, scanErr
			}
			images = append(images, url)
		}
		imageRows.Close()

		gp.Images = images
		posts = append(posts, &gp)
	}

	return posts, nil
}

func (s *Service) UpdateGroupPost(id int64, request models.UpdateGroupPostRequest) error {
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
	args = append(args, id)

	_, err = tx.Exec(query, args...)
	return err
}

func (s *Service) DeleteGroupPost(id int64) error {
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
	_, err = tx.Exec(`DELETE FROM group_posts WHERE id = ?`, id)
	return err
}
