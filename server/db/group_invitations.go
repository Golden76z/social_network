package db

import (
	"github.com/Golden76z/social-network/models"
)

// CreateGroupInvitation inserts a new group invitation into the database.
func (s *Service) CreateGroupInvitation(request models.InviteToGroupRequest, userID int) error {
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
        INSERT INTO group_invitations (group_id, invited_user_id, invited_by, status)
        VALUES (?, ?, ?, ?)`,
		request.GroupID, request.UserID, userID, "pending")
	return err
}

// GetGroupInvitationByID retrieves a group invitation by its ID.
func (s *Service) GetGroupInvitationByID(id int64) (*models.GroupInvitation, error) {
	row := s.DB.QueryRow(`
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
func (s *Service) UpdateGroupInvitationStatus(id int64, status string) error {
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
	_, err = tx.Exec(`UPDATE group_invitations SET status = ? WHERE id = ?`, status, id)
	return err
}

// DeleteGroupInvitation removes a group invitation from the database by its ID.
func (s *Service) DeleteGroupInvitation(id int64) error {
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
	_, err = tx.Exec(`DELETE FROM group_invitations WHERE id = ?`, id)
	return err
}

// GetGroupInvitationsByGroupID retrieves all invitations for a group.
func (s *Service) GetGroupInvitationsByGroupID(groupID int64) ([]models.GroupInvitation, error) {
	rows, err := s.DB.Query(`SELECT id, group_id, invited_user_id, invited_by, status, created_at FROM group_invitations WHERE group_id = ?`, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var invitations []models.GroupInvitation
	for rows.Next() {
		var inv models.GroupInvitation
		if err := rows.Scan(&inv.ID, &inv.GroupID, &inv.InvitedUserID, &inv.InvitedBy, &inv.Status, &inv.CreatedAt); err != nil {
			return nil, err
		}
		invitations = append(invitations, inv)
	}
	return invitations, nil
}

// GetPendingGroupInvitation retrieves a pending group invitation for a specific user and group.
func (s *Service) GetPendingGroupInvitation(groupID int64, userID int64) (*models.GroupInvitation, error) {
	row := s.DB.QueryRow(`SELECT id, group_id, invited_user_id, invited_by, status, created_at FROM group_invitations WHERE group_id = ? AND invited_user_id = ? AND status = 'pending'`, groupID, userID)
	var inv models.GroupInvitation
	err := row.Scan(&inv.ID, &inv.GroupID, &inv.InvitedUserID, &inv.InvitedBy, &inv.Status, &inv.CreatedAt)
	if err != nil {
		return nil, nil // Not found is not an error
	}
	return &inv, nil
}
