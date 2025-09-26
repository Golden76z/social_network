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
func (s *Service) GetGroupMembers(groupID int64, offset int, userID int64) ([]*models.GroupMemberWithUser, error) {
	tx, err := s.DB.Begin()
	if err != nil {
		return nil, err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		} else {
			_ = tx.Commit()
		}
	}()

	members := make([]*models.GroupMemberWithUser, 0)

	// First check if group exists
	var groupExists bool
	err = tx.QueryRow(`SELECT EXISTS(SELECT 1 FROM groups WHERE id = ?)`, groupID).Scan(&groupExists)
	if err != nil {
		return nil, err
	}
	if !groupExists {
		return nil, errors.New("group does not exist")
	}

	// Get group members with user information (anyone can view members)
	rows, err := tx.Query(`
		SELECT gm.id, gm.group_id, gm.user_id, gm.role, gm.invited_by, gm.created_at,
		       u.nickname, u.first_name, u.last_name, u.avatar
		FROM group_members gm
		JOIN users u ON gm.user_id = u.id
		WHERE gm.group_id = ?
		ORDER BY gm.created_at ASC
		LIMIT 20 OFFSET ?
	`, groupID, offset)
	if err != nil {
		fmt.Println("Error: ", err)
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var gm models.GroupMemberWithUser
		var nickname, firstName, lastName sql.NullString
		var avatar sql.NullString
		if scanErr := rows.Scan(&gm.ID, &gm.GroupID, &gm.UserID, &gm.Role, &gm.InvitedBy, &gm.CreatedAt,
			&nickname, &firstName, &lastName, &avatar); scanErr != nil {
			err = scanErr // triggers rollback via defer
			return nil, err
		}

		// Convert sql.NullString to string
		if nickname.Valid {
			gm.Nickname = nickname.String
		}
		if firstName.Valid {
			gm.FirstName = firstName.String
		}
		if lastName.Valid {
			gm.LastName = lastName.String
		}
		if avatar.Valid {
			gm.Avatar = avatar.String
		}

		members = append(members, &gm)
	}

	if err = rows.Err(); err != nil {
		return nil, err
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

	// Check if the user is the group admin
	var isAdmin bool
	err = tx.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM group_members 
			WHERE group_id = ? AND user_id = ? AND role = 'admin'
		)
	`, request.GroupID, request.UserID).Scan(&isAdmin)
	if err != nil {
		return fmt.Errorf("failed to check admin status: %w", err)
	}

	// If the user is the admin, delete the entire group
	if isAdmin {
		// Delete all group-related data
		_, err = tx.Exec(`DELETE FROM group_messages WHERE group_id = ?`, request.GroupID)
		if err != nil {
			return fmt.Errorf("failed to delete group messages: %w", err)
		}

		_, err = tx.Exec(`DELETE FROM group_comments WHERE group_post_id IN (SELECT id FROM group_posts WHERE group_id = ?)`, request.GroupID)
		if err != nil {
			return fmt.Errorf("failed to delete group comments: %w", err)
		}

		_, err = tx.Exec(`DELETE FROM group_posts WHERE group_id = ?`, request.GroupID)
		if err != nil {
			return fmt.Errorf("failed to delete group posts: %w", err)
		}

		_, err = tx.Exec(`DELETE FROM group_requests WHERE group_id = ?`, request.GroupID)
		if err != nil {
			return fmt.Errorf("failed to delete group requests: %w", err)
		}

		_, err = tx.Exec(`DELETE FROM group_invitations WHERE group_id = ?`, request.GroupID)
		if err != nil {
			return fmt.Errorf("failed to delete group invitations: %w", err)
		}

		_, err = tx.Exec(`DELETE FROM group_events WHERE group_id = ?`, request.GroupID)
		if err != nil {
			return fmt.Errorf("failed to delete group events: %w", err)
		}

		_, err = tx.Exec(`DELETE FROM group_members WHERE group_id = ?`, request.GroupID)
		if err != nil {
			return fmt.Errorf("failed to delete group members: %w", err)
		}

		_, err = tx.Exec(`DELETE FROM groups WHERE id = ?`, request.GroupID)
		if err != nil {
			return fmt.Errorf("failed to delete group: %w", err)
		}

		return nil
	}

	// For non-admin users, just remove them from the group
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

// IsGroupMember checks if a user is a member of a group
func (s *Service) IsGroupMember(userID, groupID int64) (bool, error) {
	var exists bool
	err := s.DB.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM group_members 
			WHERE group_id = ? AND user_id = ?
		)
	`, groupID, userID).Scan(&exists)
	if err != nil {
		return false, err
	}
	return exists, nil
}
