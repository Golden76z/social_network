package db

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"github.com/Golden76z/social-network/models"
)

// Method to create a new user after he accepted the invitation
func (s *Service) CreateGroupMember(req models.GroupMember) error {
	tx, err := s.DB.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		} else {
			_ = tx.Commit()
		}
	}()

	_, err = tx.Exec(`
		INSERT INTO group_members (group_id, user_id, role, invited_by)
		VALUES (?, ?, ?, ?)`,
		req.GroupID, req.UserID, req.Role, req.InvitedBy,
	)
	if err != nil {
		if sqliteErr, ok := err.(interface{ Error() string }); ok &&
			strings.Contains(sqliteErr.Error(), "UNIQUE constraint failed") {
			return errors.New("user is already a member of the group")
		}
		return err
	}

	return nil
}

// getUserGroups retrieves the groups a user belongs to from the database
func (s *Service) GetUserGroups(userID int) ([]string, error) {
	query := `
		SELECT g.id FROM groups g
		JOIN group_members gm ON g.id = gm.group_id
		WHERE gm.user_id = ?
	`

	rows, err := s.DB.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var groups []string
	for rows.Next() {
		var groupID string
		if err := rows.Scan(&groupID); err != nil {
			return nil, err
		}
		groups = append(groups, groupID)
	}

	return groups, nil
}

func (s *Service) GetGroupMemberByID(memberID int64) (*models.GroupMember, error) {
	row := s.DB.QueryRow(`
        SELECT id, group_id, user_id, role, invited_by, created_at
        FROM group_members WHERE id = ?`, memberID)
	var gm models.GroupMember
	err := row.Scan(&gm.ID, &gm.GroupID, &gm.UserID, &gm.Role, &gm.InvitedBy, &gm.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &gm, nil
}

// Method to retrieve a list a member from a given group with a limit
func (s *Service) GetGroupMembers(groupID int64, offset int, userID int64) ([]*models.GroupMember, error) {
	tx, err := s.DB.Begin()
	if err != nil {
		fmt.Println("Error: ", err)
		return nil, err
	}
	defer func() {
		if err != nil {
			fmt.Println("Error: ", err)
			_ = tx.Rollback()
		} else {
			_ = tx.Commit()
		}
	}()

	members := make([]*models.GroupMember, 0)
	fmt.Println("UserID: ", userID)
	fmt.Println("GroupID: ", groupID)

	rows, err := tx.Query(`
		WITH
		existing_group AS (
			SELECT 1 AS exists_flag FROM groups WHERE id = ?
		),
		authorized_user AS (
			SELECT 1 AS is_authorized
			FROM group_members
			WHERE group_id = ? AND user_id = ?
		)
		SELECT gm.id, gm.group_id, gm.user_id, gm.role, gm.invited_by, gm.created_at
		FROM group_members gm, existing_group eg, authorized_user au
		WHERE gm.group_id = ?
		ORDER BY gm.created_at ASC
		LIMIT 20 OFFSET ?
	`, groupID, groupID, userID, groupID, offset)
	if err != nil {
		fmt.Println("Error: ", err)
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var gm models.GroupMember
		if scanErr := rows.Scan(&gm.ID, &gm.GroupID, &gm.UserID, &gm.Role, &gm.InvitedBy, &gm.CreatedAt); scanErr != nil {
			err = scanErr // triggers rollback via defer
			fmt.Println("Error: ", err)
			return nil, err
		}
		members = append(members, &gm)
	}

	if err = rows.Err(); err != nil {
		fmt.Println("Error: ", err)
		return nil, err
	}

	if len(members) == 0 {
		var groupExists bool
		err = tx.QueryRow(`SELECT EXISTS(SELECT 1 FROM groups WHERE id = ?)`, groupID).Scan(&groupExists)
		if err != nil {
			fmt.Println("Error: ", err)
			return nil, err
		}
		if !groupExists {
			fmt.Println("Error: ", err)
			return nil, errors.New("group does not exist")
		}
		fmt.Println("Error: ", err)
		return nil, errors.New("user is not authorized to view group members")
	}

	return members, nil
}

// Method to promote someone to group admin, checking the one making the request is admin itself
func (s *Service) UpdateGroupMemberRole(req models.UpdateGroupMemberRequest, userID int64) error {
	tx, err := s.DB.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		} else {
			_ = tx.Commit()
		}
	}()

	// First, verify that the requester is an admin of the group
	var requesterIsAdmin bool
	err = tx.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM group_members 
			WHERE group_id = ? AND user_id = ? AND role = 'admin'
		)
	`, req.GroupID, userID).Scan(&requesterIsAdmin)
	if err != nil {
		return err
	}
	if !requesterIsAdmin {
		return errors.New("not authorized: requester is not an admin of this group")
	}

	// Get current role of the target member and verify they're in the group
	var currentRole string
	err = tx.QueryRow(`
		SELECT role FROM group_members 
		WHERE group_id = ? AND user_id = ?
	`, req.GroupID, req.MemberID).Scan(&currentRole)
	if err != nil {
		if err == sql.ErrNoRows {
			return errors.New("member not found in this group")
		}
		return err
	}

	// If role is already what we want, no change needed
	if currentRole == req.Role {
		return errors.New("member already has the requested role")
	}

	// If demoting from admin to member, check that there will be at least one admin left
	if currentRole == "admin" && req.Role == "member" {
		var adminCount int
		err = tx.QueryRow(`
			SELECT COUNT(*) FROM group_members 
			WHERE group_id = ? AND role = 'admin'
		`, req.GroupID).Scan(&adminCount)
		if err != nil {
			return err
		}
		if adminCount <= 1 {
			return errors.New("cannot demote: would remove the last admin from the group")
		}
	}

	// Update the role
	res, err := tx.Exec(`
		UPDATE group_members 
		SET role = ? 
		WHERE group_id = ? AND user_id = ?
	`, req.Role, req.GroupID, req.MemberID)
	if err != nil {
		return err
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return errors.New("failed to update member role")
	}

	return nil
}

// LeaveGroup removes a user from a group
func (s *Service) DeleteGroupMember(request models.LeaveGroupRequest, userID int) error {
	tx, err := s.DB.Begin()
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

	// Only allow delete if the requester is the same person or the group admin
	res, err := tx.Exec(`
		DELETE FROM group_members
		WHERE group_id = ? AND user_id = ?
		  AND (
		    ? = user_id OR EXISTS (
		      SELECT 1 FROM group_members AS gm_admin
		      WHERE gm_admin.group_id = group_members.group_id
		        AND gm_admin.user_id = ?
		        AND gm_admin.role = 'admin'
		    )
		  )
	`, request.GroupID, request.UserID, userID, userID)
	if err != nil {
		return fmt.Errorf("failed to delete group member: %w", err)
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("could not determine affected rows: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("permission denied or user not found in group")
	}

	return nil
}
