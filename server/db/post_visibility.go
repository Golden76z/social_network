package db

import (
    "database/sql"
    "github.com/Golden76z/social-network/models"
)

func CreatePostVisibility(db *sql.DB, postID, userID int64) error {
    tx, err := db.Begin()
    if err != nil { return err }
    defer func() {
        if err != nil { tx.Rollback() } else { _ = tx.Commit() }
    }()
    _, err = tx.Exec(`
        INSERT INTO post_visibility (post_id, user_id)
        VALUES (?, ?)`, postID, userID)
    return err
}

func GetPostVisibilityByID(db *sql.DB, id int64) (*models.PostVisibility, error) {
    row := db.QueryRow(`
        SELECT id, post_id, user_id
        FROM post_visibility WHERE id = ?`, id)
    var pv models.PostVisibility
    err := row.Scan(&pv.ID, &pv.PostID, &pv.UserID)
    if err != nil { return nil, err }
    return &pv, nil
}

func DeletePostVisibility(db *sql.DB, id int64) error {
    tx, err := db.Begin()
    if err != nil { return err }
    defer func() {
        if err != nil { tx.Rollback() } else { _ = tx.Commit() }
    }()
    _, err = tx.Exec(`DELETE FROM post_visibility WHERE id = ?`, id)
    return err
}