package db

import (
	"database/sql"

	"github.com/Golden76z/social-network/models"
)

func CreateGroupPost(db *sql.DB, request models.CreateGroupPostRequest, userID int64) error {
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
        INSERT INTO group_posts (group_id, user_id, title, body, image)
        VALUES (?, ?, ?, ?, ?)`, request.GroupID, userID, request.Title, request.Body, request.Image)
	return err
}

func GetGroupPostByID(db *sql.DB, id int64) (*models.Post, error) {
	row := db.QueryRow(`
        SELECT id, user_id, title, body, image, created_at, updated_at
        FROM group_posts WHERE id = ?`, id)
	var gp models.Post
	err := row.Scan(&gp.ID, &gp.UserID, &gp.Title, &gp.Body, &gp.Image, &gp.CreatedAt, &gp.UpdatedAt)
	if err != nil {
		return nil, err
	}
	// For group posts, visibility is always public within the group
	gp.Visibility = "public"
	return &gp, nil
}

func UpdateGroupPost(db *sql.DB, id int64, request models.UpdateGroupPostRequest) error {
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

	// Build dynamic update query
	query := "UPDATE group_posts SET updated_at = CURRENT_TIMESTAMP"
	args := []interface{}{}

	if request.Title != nil {
		query += ", title = ?"
		args = append(args, *request.Title)
	}

	if request.Body != nil {
		query += ", body = ?"
		args = append(args, *request.Body)
	}

	if request.Image != nil {
		query += ", image = ?"
		args = append(args, *request.Image)
	}

	query += " WHERE id = ?"
	args = append(args, id)

	_, err = tx.Exec(query, args...)
	return err
}

func DeleteGroupPost(db *sql.DB, id int64) error {
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
	_, err = tx.Exec(`DELETE FROM group_posts WHERE id = ?`, id)
	return err
}
