package db

import (
    "database/sql"
    "github.com/Golden76z/social-network/models"
)

func CreateEventRSVP(db *sql.DB, eventID, userID int64, status string) error {
    tx, err := db.Begin()
    if err != nil { return err }
    defer func() { if err != nil { tx.Rollback() } else { _ = tx.Commit() } }()
    _, err = tx.Exec(`
        INSERT INTO event_rsvps (event_id, user_id, status)
        VALUES (?, ?, ?)`, eventID, userID, status)
    return err
}

func GetEventRSVPByID(db *sql.DB, id int64) (*models.EventRSVP, error) {
    row := db.QueryRow(`
        SELECT id, event_id, user_id, status, created_at
        FROM event_rsvps WHERE id = ?`, id)
    var rsvp models.EventRSVP
    err := row.Scan(&rsvp.ID, &rsvp.EventID, &rsvp.UserID, &rsvp.Status, &rsvp.CreatedAt)
    if err != nil { return nil, err }
    return &rsvp, nil
}

func UpdateEventRSVPStatus(db *sql.DB, id int64, status string) error {
    tx, err := db.Begin()
    if err != nil { return err }
    defer func() { if err != nil { tx.Rollback() } else { _ = tx.Commit() } }()
    _, err = tx.Exec(`UPDATE event_rsvps SET status = ? WHERE id = ?`, status, id)
    return err
}

func DeleteEventRSVP(db *sql.DB, id int64) error {
    tx, err := db.Begin()
    if err != nil { return err }
    defer func() { if err != nil { tx.Rollback() } else { _ = tx.Commit() } }()
    _, err = tx.Exec(`DELETE FROM event_rsvps WHERE id = ?`, id)
    return err
}