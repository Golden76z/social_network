package db

import (
	"database/sql"

	"github.com/Golden76z/social-network/models"
)

// GroupInvitation represents a group invitation in the database
type GroupInvitation struct {
	ID            int64  `json:"id"`
	GroupID       int64  `json:"group_id"`
	InvitedUserID int64  `json:"invited_user_id"`
	InvitedBy     int64  `json:"invited_by"`
	Status        string `json:"status"`
	CreatedAt     string `json:"created_at"`
}

// CreateGroupInvitation inserts a new group invitation into the database.
func CreateGroupInvitation(db *sql.DB, request models.InviteToGroupRequest) error {
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
		request.GroupID, request.UserID, request.InvitedBy, "pending")
	return err
}

// GetGroupInvitationByID retrieves a group invitation by its ID.
func GetGroupInvitationByID(db *sql.DB, id int64) (*GroupInvitation, error) {
	row := db.QueryRow(`
        SELECT id, group_id, invited_user_id, invited_by, status, created_at
        FROM group_invitations WHERE id = ?`, id)

	var gi GroupInvitation
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
