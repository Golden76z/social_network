package db

import (
    "database/sql"
    "github.com/Golden76z/social-network/models"
)

func CreateGroupMessage(db *sql.DB, groupID, senderID int64, body string) error {
    tx, err := db.Begin()
    if err != nil { return err }
    defer func() { if err != nil { tx.Rollback() } else { _ = tx.Commit() } }()
    _, err = tx.Exec(`
        INSERT INTO group_messages (group_id, sender_id, body)
        VALUES (?, ?, ?)`, groupID, senderID, body)
    return err
}

func GetGroupMessageByID(db *sql.DB, id int64) (*models.GroupMessage, error) {
    row := db.QueryRow(`
        SELECT id, group_id, sender_id, body, created_at
        FROM group_messages WHERE id = ?`, id)
    var gm models.GroupMessage
    err := row.Scan(&gm.ID, &gm.GroupID, &gm.SenderID, &gm.Body, &gm.CreatedAt)
    if err != nil { return nil, err }
    return &gm, nil
}

func DeleteGroupMessage(db *sql.DB, id int64) error {
    tx, err := db.Begin()
    if err != nil { return err }
    defer func() { if err != nil { tx.Rollback() } else { _ = tx.Commit() } }()
    _, err = tx.Exec(`DELETE FROM group_messages WHERE id = ?`, id)
    return err
}