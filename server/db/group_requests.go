package db

import (
	"database/sql"

	"github.com/Golden76z/social-network/models"
)

// GroupRequest represents a group join request in the database
type GroupRequest struct {
	ID        int64  `json:"id"`
	GroupID   int64  `json:"group_id"`
	UserID    int64  `json:"user_id"`
	Status    string `json:"status"`
	CreatedAt string `json:"created_at"`
}

func (s *Service) CreateGroupRequest(groupID, userID int64, status string) error {
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
        INSERT INTO group_requests (group_id, user_id, status)
        VALUES (?, ?, ?)`, groupID, userID, status)
	return err
}

func (s *Service) GetGroupRequestByID(id int64) (*GroupRequest, error) {
	row := s.DB.QueryRow(`
        SELECT id, group_id, user_id, status, created_at
        FROM group_requests WHERE id = ?`, id)
	var gr GroupRequest
	err := row.Scan(&gr.ID, &gr.GroupID, &gr.UserID, &gr.Status, &gr.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &gr, nil
}

func (s *Service) UpdateGroupRequestStatus(id int64, status string) error {
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
	_, err = tx.Exec(`UPDATE group_requests SET status = ? WHERE id = ?`, status, id)
	return err
}

func (s *Service) DeleteGroupRequest(id int64) error {
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
	_, err = tx.Exec(`DELETE FROM group_requests WHERE id = ?`, id)
	return err
}

// GetGroupRequestByGroupAndUser finds the latest request for a user in a group
func (s *Service) GetGroupRequestByGroupAndUser(groupID, userID int64) (*GroupRequest, error) {
	row := s.DB.QueryRow(`
        SELECT id, group_id, user_id, status, created_at
        FROM group_requests
        WHERE group_id = ? AND user_id = ?
        ORDER BY created_at DESC
        LIMIT 1`, groupID, userID)
	var gr GroupRequest
	if err := row.Scan(&gr.ID, &gr.GroupID, &gr.UserID, &gr.Status, &gr.CreatedAt); err != nil {
		return nil, err
	}
	return &gr, nil
}

// HasPendingGroupRequest checks if a user has a pending request for a group
func (s *Service) HasPendingGroupRequest(userID, groupID int64) (bool, error) {
	var count int
	err := s.DB.QueryRow(`
        SELECT COUNT(*) FROM group_requests 
        WHERE user_id = ? AND group_id = ? AND status = 'pending'`, userID, groupID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// GetGroupRequestsByGroup lists requests for a group, optionally filtered by status
func (s *Service) GetGroupRequestsByGroup(groupID int64, status string, limit, offset int) ([]models.GroupRequestWithUser, error) {
	query := `SELECT gr.id, gr.group_id, gr.user_id, gr.status, gr.created_at,
	              u.nickname, u.first_name, u.last_name, u.avatar
	          FROM group_requests gr
	          JOIN users u ON gr.user_id = u.id
	          WHERE gr.group_id = ?`
	args := []interface{}{groupID}
	if status != "" {
		query += " AND gr.status = ?"
		args = append(args, status)
	}
	query += " ORDER BY gr.created_at DESC LIMIT ? OFFSET ?"
	args = append(args, limit, offset)
	rows, err := s.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	reqs := make([]models.GroupRequestWithUser, 0)
	for rows.Next() {
		var gr models.GroupRequestWithUser
		var nickname, firstName, lastName sql.NullString
		var avatar sql.NullString
		if err := rows.Scan(&gr.ID, &gr.GroupID, &gr.UserID, &gr.Status, &gr.CreatedAt,
			&nickname, &firstName, &lastName, &avatar); err != nil {
			return nil, err
		}

		// Convert sql.NullString to string
		if nickname.Valid {
			gr.Nickname = nickname.String
		}
		if firstName.Valid {
			gr.FirstName = firstName.String
		}
		if lastName.Valid {
			gr.LastName = lastName.String
		}
		if avatar.Valid {
			gr.Avatar = avatar.String
		}

		reqs = append(reqs, gr)
	}
	return reqs, nil
}

// GetUserPendingRequests gets all pending requests for a user
func (s *Service) GetUserPendingRequests(userID int64) ([]GroupRequest, error) {
	query := `SELECT id, group_id, user_id, status, created_at FROM group_requests WHERE user_id = ? AND status = 'pending' ORDER BY created_at DESC`
	rows, err := s.DB.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	reqs := make([]GroupRequest, 0)
	for rows.Next() {
		var gr GroupRequest
		if err := rows.Scan(&gr.ID, &gr.GroupID, &gr.UserID, &gr.Status, &gr.CreatedAt); err != nil {
			return nil, err
		}
		reqs = append(reqs, gr)
	}
	return reqs, nil
}
