package db

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/Golden76z/social-network/models"
)

func CreatePost(db *sql.DB, userID int64, req models.CreatePostRequest) error {
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
        INSERT INTO posts (user_id, title, body, image, visibility)
        VALUES (?, ?, ?, ?, ?)`,
		userID, req.Title, req.Body, req.Image, req.Visibility)
	return err
}

func GetPostByID(db *sql.DB, postID int64) (*models.Post, error) {
	row := db.QueryRow(`
        SELECT id, user_id, title, body, image, visibility, created_at, updated_at
        FROM posts WHERE id = ?`, postID)
	var post models.Post
	err := row.Scan(
		&post.ID,
		&post.UserID,
		&post.Title,
		&post.Body,
		&post.Image,
		&post.Visibility,
		&post.CreatedAt,
		&post.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &post, nil
}

func UpdatePost(db *sql.DB, postID int64, req models.UpdatePostRequest) error {
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
	if req.Image != nil {
		setParts = append(setParts, "image = ?")
		args = append(args, *req.Image)
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

func DeletePost(db *sql.DB, postID int64) error {
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
	_, err = tx.Exec(`DELETE FROM posts WHERE id = ?`, postID)
	return err
}
