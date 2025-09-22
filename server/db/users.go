package db

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/Golden76z/social-network/models"
)

// GetUserByID retrieves a user by their unique ID.
func (s *Service) GetUserByID(userID int64) (*models.User, error) {
	row := s.DB.QueryRow(`
        SELECT id, nickname, first_name, last_name, email, password, date_of_birth, avatar, bio, is_private
        FROM users WHERE id = ?`, userID)
	var user models.User
	err := row.Scan(
		&user.ID,
		&user.Nickname,
		&user.FirstName,
		&user.LastName,
		&user.Email,
		&user.Password,
		&user.DateOfBirth,
		&user.Avatar,
		&user.Bio,
		&user.IsPrivate,
	)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// IncrementFollowingCount increments the number of users this user is following
func (s *Service) IncrementFollowingCount(userID int64) error {
	_, err := s.DB.Exec(`UPDATE users SET followed = followed + 1 WHERE id = ?`, userID)
	return err
}

// IncrementFollowersCount increments the number of followers for a user
func (s *Service) IncrementFollowersCount(userID int64) error {
	_, err := s.DB.Exec(`UPDATE users SET followers = followers + 1 WHERE id = ?`, userID)
	return err
}

// DecrementFollowingCount decrements the number of users this user is following
func (s *Service) DecrementFollowingCount(userID int64) error {
	_, err := s.DB.Exec(`UPDATE users SET followed = followed - 1 WHERE id = ?`, userID)
	return err
}

// DecrementFollowersCount decrements the number of followers for a user
func (s *Service) DecrementFollowersCount(userID int64) error {
	_, err := s.DB.Exec(`UPDATE users SET followers = followers - 1 WHERE id = ?`, userID)
	return err
}

// SyncFollowCounts synchronizes the stored follower/following counts with actual counts from follow_requests table
func (s *Service) SyncFollowCounts(userID int64) error {
	// Get actual follower count
	var actualFollowers int
	err := s.DB.QueryRow(`
		SELECT COUNT(*) 
		FROM follow_requests 
		WHERE target_id = ? AND status = 'accepted'
	`, userID).Scan(&actualFollowers)
	if err != nil {
		return err
	}

	// Get actual following count
	var actualFollowing int
	err = s.DB.QueryRow(`
		SELECT COUNT(*) 
		FROM follow_requests 
		WHERE requester_id = ? AND status = 'accepted'
	`, userID).Scan(&actualFollowing)
	if err != nil {
		return err
	}

	// Update stored counts
	_, err = s.DB.Exec(`
		UPDATE users 
		SET followers = ?, followed = ? 
		WHERE id = ?
	`, actualFollowers, actualFollowing, userID)
	return err
}

func (s *Service) CreateUser(req models.User) error {
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
		INSERT INTO users (nickname, first_name, last_name, email, password, date_of_birth, avatar, bio, is_private)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		req.Nickname, req.FirstName, req.LastName, req.Email, req.Password, req.DateOfBirth, req.Avatar, req.Bio, req.IsPrivate)
	return err
}

func (s *Service) GetUserByEmail(email string) (*models.User, error) {
	row := s.DB.QueryRow(`
		SELECT id, nickname, first_name, last_name, email, password, date_of_birth, avatar, bio, is_private
		FROM users WHERE email = ?`, email)

	var user models.User
	err := row.Scan(
		&user.ID,
		&user.Nickname,
		&user.FirstName,
		&user.LastName,
		&user.Email,
		&user.Password,
		&user.DateOfBirth,
		&user.Avatar,
		&user.Bio,
		&user.IsPrivate,
	)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetUserIDByIdentifier retrieves a user's ID by either nickname or email
func (s *Service) GetUserIDByUsername(identifier string) (int64, error) {
	var userID int64

	// Single query that checks both nickname and email
	err := s.DB.QueryRow(`
		SELECT id 
		FROM users 
		WHERE nickname = ? OR email = ? 
		LIMIT 1`,
		identifier, identifier,
	).Scan(&userID)

	if err != nil {
		if err == sql.ErrNoRows {
			return 0, fmt.Errorf("user not found")
		}
		return 0, fmt.Errorf("database error: %w", err)
	}

	return userID, nil
}

func (s *Service) UpdateUser(userID int64, req models.UpdateUserProfileRequest) error {
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

	var setParts []string
	var args []interface{}

	if req.Nickname != nil {
		setParts = append(setParts, "nickname = ?")
		args = append(args, *req.Nickname)
	}
	if req.FirstName != nil {
		setParts = append(setParts, "first_name = ?")
		args = append(args, *req.FirstName)
	}
	if req.LastName != nil {
		setParts = append(setParts, "last_name = ?")
		args = append(args, *req.LastName)
	}
	if req.Email != nil {
		setParts = append(setParts, "email = ?")
		args = append(args, *req.Email)
	}
	if req.DateOfBirth != nil {
		setParts = append(setParts, "date_of_birth = ?")
		args = append(args, *req.DateOfBirth)
	}
	if req.Avatar != nil {
		setParts = append(setParts, "avatar = ?")
		args = append(args, *req.Avatar)
	}
	if req.Bio != nil {
		setParts = append(setParts, "bio = ?")
		args = append(args, *req.Bio)
	}
	if req.IsPrivate != nil {
		setParts = append(setParts, "is_private = ?")
		args = append(args, *req.IsPrivate)
	}

	if len(setParts) == 0 {
		return fmt.Errorf("no fields to update")
	}

	query := fmt.Sprintf("UPDATE users SET %s WHERE id = ?", strings.Join(setParts, ", "))
	args = append(args, userID)

	_, err = tx.Exec(query, args...)
	return err
}

func (s *Service) DeleteUser(userID int64) error {
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
	_, err = tx.Exec(`DELETE FROM users WHERE id = ?`, userID)
	return err
}
