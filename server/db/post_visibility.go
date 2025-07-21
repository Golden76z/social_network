package db

// PostVisibility represents a post visibility setting in the database
type PostVisibility struct {
	ID     int64 `json:"id"`
	PostID int64 `json:"post_id"`
	UserID int64 `json:"user_id"`
}

func (s *Service) CreatePostVisibility(postID, userID int64) error {
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
        INSERT INTO post_visibility (post_id, user_id)
        VALUES (?, ?)`, postID, userID)
	return err
}

func (s *Service) GetPostVisibilityByID(id int64) (*PostVisibility, error) {
	row := s.DB.QueryRow(`
        SELECT id, post_id, user_id
        FROM post_visibility WHERE id = ?`, id)
	var pv PostVisibility
	err := row.Scan(&pv.ID, &pv.PostID, &pv.UserID)
	if err != nil {
		return nil, err
	}
	return &pv, nil
}

func (s *Service) DeletePostVisibility(id int64) error {
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
	_, err = tx.Exec(`DELETE FROM post_visibility WHERE id = ?`, id)
	return err
}
