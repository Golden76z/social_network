package db

import (
    "database/sql"
    "github.com/Golden76z/social-network/models"
)

func CreateGroupEvent(db *sql.DB, groupID, creatorID int64, title, description, eventDateTime string) error {
    tx, err := db.Begin()
    if err != nil { return err }
    defer func() { if err != nil { tx.Rollback() } else { _ = tx.Commit() } }()
    _, err = tx.Exec(`
        INSERT INTO group_events (group_id, creator_id, title, description, event_datetime)
        VALUES (?, ?, ?, ?, ?)`, groupID, creatorID, title, description, eventDateTime)
    return err
}

func GetGroupEventByID(db *sql.DB, id int64) (*models.GroupEvent, error) {
    row := db.QueryRow(`
        SELECT id, group_id, creator_id, title, description, event_datetime, created_at
        FROM group_events WHERE id = ?`, id)
    var ge models.GroupEvent
    err := row.Scan(&ge.ID, &ge.GroupID, &ge.CreatorID, &ge.Title, &ge.Description, &ge.EventDateTime, &ge.CreatedAt)
    if err != nil { return nil, err }
    return &ge, nil
}

func DeleteGroupEvent(db *sql.DB, id int64) error {
    tx, err := db.Begin()
    if err != nil { return err }
    defer func() { if err != nil { tx.Rollback() } else { _ = tx.Commit() } }()
    _, err = tx.Exec(`DELETE FROM group_events WHERE id = ?`, id)
    return err
}