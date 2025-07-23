package db

import (
	"github.com/Golden76z/social-network/models"
)

func (s *Service) CreateGroup(request models.CreateGroupRequest, creatorID int64) error {
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
        INSERT INTO groups (title, avatar, bio, creator_id)
        VALUES (?, ?, ?, ?)`, request.Title, request.Avatar, request.Bio, creatorID)
	return err
}

func (s *Service) GetGroupByID(groupID int64) (*models.GroupResponse, error) {
	row := s.DB.QueryRow(`
        SELECT id, title, avatar, bio, creator_id, created_at, updated_at
        FROM groups WHERE id = ?`, groupID)
	var g models.GroupResponse
	err := row.Scan(&g.ID, &g.Title, &g.Avatar, &g.Bio, &g.CreatorID, &g.CreatedAt, &g.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &g, nil
}

// getGroupName retrieves the group name from the database
func (s *Service) GetGroupName(groupID string) error {
	query := `SELECT name FROM groups WHERE id = ?`

	var name string
	err := s.DB.QueryRow(query, groupID).Scan(&name)
	if err != nil {
		return err
	}

	return nil
}

func (s *Service) UpdateGroup(groupID int64, request models.UpdateGroupRequest) error {
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

	// Build dynamic update query
	query := "UPDATE groups SET updated_at = CURRENT_TIMESTAMP"
	args := []interface{}{}

	if request.Title != nil {
		query += ", title = ?"
		args = append(args, *request.Title)
	}

	if request.Avatar != nil {
		query += ", avatar = ?"
		args = append(args, *request.Avatar)
	}

	if request.Bio != nil {
		query += ", bio = ?"
		args = append(args, *request.Bio)
	}

	query += " WHERE id = ?"
	args = append(args, groupID)

	_, err = tx.Exec(query, args...)
	return err
}

func (s *Service) DeleteGroup(groupID int64) error {
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
	_, err = tx.Exec(`DELETE FROM groups WHERE id = ?`, groupID)
	return err
}
