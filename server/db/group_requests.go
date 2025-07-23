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
