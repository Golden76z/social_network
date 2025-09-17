package db

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

// GetGroupRequestsByGroup lists requests for a group, optionally filtered by status
func (s *Service) GetGroupRequestsByGroup(groupID int64, status string, limit, offset int) ([]GroupRequest, error) {
	query := `SELECT id, group_id, user_id, status, created_at FROM group_requests WHERE group_id = ?`
	args := []interface{}{groupID}
	if status != "" {
		query += " AND status = ?"
		args = append(args, status)
	}
	query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
	args = append(args, limit, offset)
	rows, err := s.DB.Query(query, args...)
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
