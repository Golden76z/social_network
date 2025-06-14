package db

import (
	"database/sql"

	"github.com/Golden76z/social-network/models"
)

func CreatePost(db *sql.DB, userID int64, title, body, image, visibility string) error {
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
		userID, title, body, image, visibility)
	return err
}

func GetPostByID(db *sql.DB, postID int64) (*models.Post, error) {
	row := db.QueryRow(`
        SELECT id, user_id, title, body, image, visibility, created_at, updated_at
        FROM posts WHERE id = ?`, postID)
	var post models.Post
	err := row.Scan(&post.ID, &post.UserID, &post.Title, &post.Body, &post.Image, &post.Visibility, &post.CreatedAt, &post.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &post, nil
}

func UpdatePost(db *sql.DB, postID int64, title, body, image, visibility string) error {
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
        UPDATE posts SET title = ?, body = ?, image = ?, visibility = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
		title, body, image, visibility, postID)
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
