package db

import (
	"fmt"
	"strings"

	"github.com/Golden76z/social-network/models"
)

func (s *Service) CreatePost(userID int64, req models.CreatePostRequest) (int64, error) {
	tx, err := s.DB.Begin()
	if err != nil {
		return 0, err
	}

	result, err := tx.Exec(`
        INSERT INTO posts (user_id, title, body, visibility)
        VALUES (?, ?, ?, ?)`,
		userID, req.Title, req.Body, req.Visibility)
	if err != nil {
		tx.Rollback()
		return 0, err
	}

	postID, err := result.LastInsertId()
	if err != nil {
		tx.Rollback()
		return 0, err
	}

	for _, imageURL := range req.Images {
		_, err := tx.Exec(`
            INSERT INTO post_images (post_id, image_url)
            VALUES (?, ?)`,
			postID, imageURL)
		if err != nil {
			tx.Rollback()
			return 0, err
		}
	}

	return postID, tx.Commit()
}

func (s *Service) InsertPostImage(postID int, isGroupPost bool, imageURL string) error {
	_, err := s.DB.Exec(`
		INSERT INTO post_images (post_id, is_group_post, image_url)
		VALUES (?, ?, ?)`, postID, isGroupPost, imageURL)
	return err
}

func (s *Service) GetPostByID(postID int64) (*models.Post, error) {
	row := s.DB.QueryRow(`
        SELECT id, user_id, title, body, visibility, created_at, updated_at
        FROM posts WHERE id = ?`, postID)
	var post models.Post
	err := row.Scan(
		&post.ID,
		&post.UserID,
		&post.Title,
		&post.Body,
		&post.Visibility,
		&post.CreatedAt,
		&post.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &post, nil
}

func (s *Service) UpdatePost(postID int64, req models.UpdatePostRequest) error {
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

	var setParts []string
	var args []interface{}

	if req.Title != nil {
		setParts = append(setParts, "title = ?")
		args = append(args, *req.Title)
	}
	if req.Body != nil {
		setParts = append(setParts, "body = ?")
		args = append(args, *req.Body)
	}
	if req.Visibility != nil {
		setParts = append(setParts, "visibility = ?")
		args = append(args, *req.Visibility)
	}

	if len(setParts) == 0 {
		return fmt.Errorf("no fields to update")
	}

	setParts = append(setParts, "updated_at = CURRENT_TIMESTAMP")
	query := fmt.Sprintf("UPDATE posts SET %s WHERE id = ?", strings.Join(setParts, ", "))
	args = append(args, postID)

	_, err = tx.Exec(query, args...)
	return err
}

func (s *Service) DeletePost(postID int64) error {
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
	_, err = tx.Exec(`DELETE FROM posts WHERE id = ?`, postID)
	return err
}
