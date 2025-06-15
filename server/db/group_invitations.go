package db

import (
	"database/sql"

	"github.com/Golden76z/social-network/models"
)

// CreateGroupInvitation inserts a new group invitation into the database.
func CreateGroupInvitation(db *sql.DB, groupID, invitedUserID, invitedBy int64, status string) error {
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
        INSERT INTO group_invitations (group_id, invited_user_id, invited_by, status)
        VALUES (?, ?, ?, ?)`,
		groupID, invitedUserID, invitedBy, status)
	return err
}

// GetGroupInvitationByID retrieves a group invitation by its ID.
func GetGroupInvitationByID(db *sql.DB, id int64) (*models.GroupInvitation, error) {
	row := db.QueryRow(`
        SELECT id, group_id, invited_user_id, invited_by, status, created_at
        FROM group_invitations WHERE id = ?`, id)

	var gi models.GroupInvitation
	err := row.Scan(
		&gi.ID,
		&gi.GroupID,
		&gi.InvitedUserID,
		&gi.InvitedBy,
		&gi.Status,
		&gi.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &gi, nil
}

// UpdateGroupInvitationStatus updates the status of a group invitation.
func UpdateGroupInvitationStatus(db *sql.DB, id int64, status string) error {
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
	_, err = tx.Exec(`UPDATE group_invitations SET status = ? WHERE id = ?`, status, id)
	return err
}

// DeleteGroupInvitation removes a group invitation from the database by its ID.
func DeleteGroupInvitation(db *sql.DB, id int64) error {
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
	_, err = tx.Exec(`DELETE FROM group_invitations WHERE id = ?`, id)
	return err
}
