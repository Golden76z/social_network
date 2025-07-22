package db

import (
	"errors"

	"github.com/Golden76z/social-network/models"
)

func (s *Service) CreateGroupMember(groupID, userID int64, role, status string, invitedBy *int64) error {
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
	_, err = tx.Exec(`
        INSERT INTO group_members (group_id, user_id, role, status, invited_by)
        VALUES (?, ?, ?, ?, ?)`, groupID, userID, role, status, invitedBy)
	return err
}

// getUserGroups retrieves the groups a user belongs to from the database
func (s *Service) GetUserGroups(userID int) ([]string, error) {
	query := `
		SELECT g.id FROM groups g
		JOIN group_members gm ON g.id = gm.group_id
		WHERE gm.user_id = ? AND gm.status = 'active'
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
        SELECT id, group_id, user_id, role, status, invited_by, created_at
        FROM group_members WHERE id = ?`, memberID)
	var gm models.GroupMember
	err := row.Scan(&gm.ID, &gm.GroupID, &gm.UserID, &gm.Role, &gm.Status, &gm.InvitedBy, &gm.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &gm, nil
}

func (s *Service) GetGroupMembers(groupID int64, offset int, userID int64) ([]*models.GroupMember, error) {
	// Check if group exists
	exists, err := s.GroupExists(groupID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, errors.New("group does not exist")
	}

	// Check if user is authorized to view members
	isMember, err := s.IsUserInGroup(userID, groupID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, errors.New("user is not a member of the group")
	}

	// Always initialize slice so it's never nil
	members := make([]*models.GroupMember, 0)

	rows, err := s.DB.Query(`
		SELECT id, group_id, user_id, role, status, invited_by, created_at
		FROM group_members
		WHERE group_id = ?
		ORDER BY created_at ASC
		LIMIT 20 OFFSET ?
	`, groupID, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var gm models.GroupMember
		if err := rows.Scan(&gm.ID, &gm.GroupID, &gm.UserID, &gm.Role, &gm.Status, &gm.InvitedBy, &gm.CreatedAt); err != nil {
			return nil, err
		}
		members = append(members, &gm)
	}

	// Still return empty slice if no rows were returned
	if err = rows.Err(); err != nil {
		return nil, err
	}

	return members, nil
}

func (s *Service) UpdateGroupMemberStatus(req models.UpdateGroupMemberRequest, userID int) error {
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
	_, err = tx.Exec(`
        UPDATE group_members SET status = ? WHERE id = ?`, req.Status, userID)
	return err
}

func (s *Service) DeleteGroupMember(memberID int64) error {
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
	_, err = tx.Exec(`DELETE FROM group_members WHERE id = ?`, memberID)
	return err
}

// LeaveGroup removes a user from a group
func (s *Service) LeaveGroup(request models.LeaveGroupRequest, userID int) error {
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
	_, err = tx.Exec(`DELETE FROM group_members WHERE group_id = ? AND user_id = ?`, request.GroupID, userID)
	return err
}
