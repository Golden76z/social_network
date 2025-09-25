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

// CreatePostVisibilityForFollowers creates visibility entries for multiple followers
func (s *Service) CreatePostVisibilityForFollowers(postID int64, followerIDs []int64) error {
	if len(followerIDs) == 0 {
		return nil
	}

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

	// Prepare batch insert
	stmt, err := tx.Prepare(`
        INSERT INTO post_visibility (post_id, user_id)
        VALUES (?, ?)`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, userID := range followerIDs {
		_, err = stmt.Exec(postID, userID)
		if err != nil {
			return err
		}
	}

	return nil
}

// DeletePostVisibilityForPost removes all visibility entries for a specific post
func (s *Service) DeletePostVisibilityForPost(postID int64) error {
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
	_, err = tx.Exec(`DELETE FROM post_visibility WHERE post_id = ?`, postID)
	return err
}

// GetPostVisibilityUsers returns all users who can see a specific private post
func (s *Service) GetPostVisibilityUsers(postID int64) ([]int64, error) {
	rows, err := s.DB.Query(`
        SELECT user_id
        FROM post_visibility
        WHERE post_id = ?`, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var userIDs []int64
	for rows.Next() {
		var userID int64
		err := rows.Scan(&userID)
		if err != nil {
			return nil, err
		}
		userIDs = append(userIDs, userID)
	}
	return userIDs, nil
}

// HasPostVisibilityAccess checks if a user has access to view a specific private post
func (s *Service) HasPostVisibilityAccess(postID, userID int64) (bool, error) {
	var count int
	err := s.DB.QueryRow(`
        SELECT COUNT(*)
        FROM post_visibility
        WHERE post_id = ? AND user_id = ?`, postID, userID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
