package db

import (
	"database/sql"

	"github.com/Golden76z/social-network/models"
)

func CreateGroup(db *sql.DB, title, avatar, bio string, creatorID int64) error {
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
        INSERT INTO groups (title, avatar, bio, creator_id)
        VALUES (?, ?, ?, ?)`, title, avatar, bio, creatorID)
	return err
}

func GetGroupByID(db *sql.DB, groupID int64) (*models.Group, error) {
	row := db.QueryRow(`
        SELECT id, title, avatar, bio, creator_id, created_at, updated_at
        FROM groups WHERE id = ?`, groupID)
	var g models.Group
	err := row.Scan(&g.ID, &g.Title, &g.Avatar, &g.Bio, &g.CreatorID, &g.CreatedAt, &g.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &g, nil
}

func UpdateGroup(db *sql.DB, groupID int64, title, avatar, bio string) error {
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
        UPDATE groups SET title = ?, avatar = ?, bio = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`, title, avatar, bio, groupID)
	return err
}

func DeleteGroup(db *sql.DB, groupID int64) error {
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
	_, err = tx.Exec(`DELETE FROM groups WHERE id = ?`, groupID)
	return err
}
