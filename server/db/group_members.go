package db

import (
	"database/sql"

	"github.com/Golden76z/social-network/models"
)

// GroupMember represents a group member in the database
type GroupMember struct {
	ID        int64  `json:"id"`
	GroupID   int64  `json:"group_id"`
	UserID    int64  `json:"user_id"`
	Role      string `json:"role"`
	Status    string `json:"status"`
	InvitedBy *int64 `json:"invited_by,omitempty"`
	CreatedAt string `json:"created_at"`
}

func CreateGroupMember(db *sql.DB, groupID, userID int64, role, status string, invitedBy *int64) error {
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
        INSERT INTO group_members (group_id, user_id, role, status, invited_by)
        VALUES (?, ?, ?, ?, ?)`, groupID, userID, role, status, invitedBy)
	return err
}

func GetGroupMemberByID(db *sql.DB, memberID int64) (*GroupMember, error) {
	row := db.QueryRow(`
        SELECT id, group_id, user_id, role, status, invited_by, created_at
        FROM group_members WHERE id = ?`, memberID)
	var gm GroupMember
	err := row.Scan(&gm.ID, &gm.GroupID, &gm.UserID, &gm.Role, &gm.Status, &gm.InvitedBy, &gm.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &gm, nil
}

func UpdateGroupMemberStatus(db *sql.DB, memberID int64, status string) error {
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
        UPDATE group_members SET status = ? WHERE id = ?`, status, memberID)
	return err
}

func DeleteGroupMember(db *sql.DB, memberID int64) error {
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
	_, err = tx.Exec(`DELETE FROM group_members WHERE id = ?`, memberID)
	return err
}

// LeaveGroup removes a user from a group
func LeaveGroup(db *sql.DB, request models.LeaveGroupRequest) error {
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
	_, err = tx.Exec(`DELETE FROM group_members WHERE group_id = ? AND user_id = ?`, request.GroupID, request.UserID)
	return err
}
