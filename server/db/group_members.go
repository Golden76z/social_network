package db

import (
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

func (s *Service) GetGroupMemberByID(memberID int64) (*GroupMember, error) {
	row := s.DB.QueryRow(`
        SELECT id, group_id, user_id, role, status, invited_by, created_at
        FROM group_members WHERE id = ?`, memberID)
	var gm GroupMember
	err := row.Scan(&gm.ID, &gm.GroupID, &gm.UserID, &gm.Role, &gm.Status, &gm.InvitedBy, &gm.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &gm, nil
}

func (s *Service) UpdateGroupMemberStatus(memberID int64, status string) error {
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
        UPDATE group_members SET status = ? WHERE id = ?`, status, memberID)
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
func (s *Service) LeaveGroup(request models.LeaveGroupRequest) error {
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
	_, err = tx.Exec(`DELETE FROM group_members WHERE group_id = ? AND user_id = ?`, request.GroupID, request.UserID)
	return err
}
