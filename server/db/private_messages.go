package db

import (
	"github.com/Golden76z/social-network/models"
)

func (s *Service) CreatePrivateMessage(senderID, receiverID int64, body string) error {
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
        INSERT INTO private_messages (sender_id, receiver_id, body)
        VALUES (?, ?, ?)`, senderID, receiverID, body)
	return err
}

func (s *Service) GetPrivateMessageByID(id int64) (*models.PrivateMessage, error) {
	row := s.DB.QueryRow(`
        SELECT id, sender_id, receiver_id, body, created_at
        FROM private_messages WHERE id = ?`, id)
	var pm models.PrivateMessage
	err := row.Scan(&pm.ID, &pm.SenderID, &pm.ReceiverID, &pm.Body, &pm.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &pm, nil
}

func (s *Service) DeletePrivateMessage(id int64) error {
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
	_, err = tx.Exec(`DELETE FROM private_messages WHERE id = ?`, id)
	return err
}

// GetConversations returns all conversations for a user (users they've exchanged messages with)
func (s *Service) GetConversations(userID int64) ([]models.Conversation, error) {
	rows, err := s.DB.Query(`
		SELECT DISTINCT 
			CASE 
				WHEN pm.sender_id = ? THEN pm.receiver_id 
				ELSE pm.sender_id 
			END as other_user_id,
			u.nickname,
			u.first_name,
			u.last_name,
			u.avatar,
			u.is_private,
			pm.body as last_message,
			pm.created_at as last_message_time
		FROM private_messages pm
		JOIN users u ON (
			CASE 
				WHEN pm.sender_id = ? THEN pm.receiver_id 
				ELSE pm.sender_id 
			END = u.id
		)
		WHERE pm.sender_id = ? OR pm.receiver_id = ?
		ORDER BY pm.created_at DESC
	`, userID, userID, userID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var conversations []models.Conversation
	for rows.Next() {
		var conv models.Conversation
		err := rows.Scan(
			&conv.OtherUserID,
			&conv.OtherUserNickname,
			&conv.OtherUserFirstName,
			&conv.OtherUserLastName,
			&conv.OtherUserAvatar,
			&conv.OtherUserIsPrivate,
			&conv.LastMessage,
			&conv.LastMessageTime,
		)
		if err != nil {
			return nil, err
		}
		conversations = append(conversations, conv)
	}
	return conversations, nil
}

// GetMessagesBetweenUsers returns messages between two users
func (s *Service) GetMessagesBetweenUsers(userID1, userID2 int64, limit, offset int) ([]models.PrivateMessage, error) {
	rows, err := s.DB.Query(`
		SELECT id, sender_id, receiver_id, body, created_at
		FROM private_messages 
		WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?
	`, userID1, userID2, userID2, userID1, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []models.PrivateMessage
	for rows.Next() {
		var msg models.PrivateMessage
		err := rows.Scan(&msg.ID, &msg.SenderID, &msg.ReceiverID, &msg.Body, &msg.CreatedAt)
		if err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}
	return messages, nil
}

// CheckCanSendMessage checks if user1 can send a message to user2
// Returns true if: user1 follows user2 OR user2 follows user1 OR user2 has public profile
func (s *Service) CheckCanSendMessage(senderID, receiverID int64) (bool, error) {
	// Check if receiver has public profile
	var isPublic bool
	err := s.DB.QueryRow(`SELECT is_private FROM users WHERE id = ?`, receiverID).Scan(&isPublic)
	if err != nil {
		return false, err
	}

	// If receiver has public profile, anyone can send messages
	if !isPublic {
		return true, nil
	}

	// Check if there's a follow relationship (either direction)
	var followExists bool
	err = s.DB.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM follow_requests 
			WHERE ((requester_id = ? AND target_id = ?) OR (requester_id = ? AND target_id = ?))
			AND status = 'accepted'
		)
	`, senderID, receiverID, receiverID, senderID).Scan(&followExists)
	if err != nil {
		return false, err
	}

	return followExists, nil
}

// GetMessageableUsers returns users that the current user can message
// This includes: followers, following, and users with public profiles
func (s *Service) GetMessageableUsers(userID int64) ([]models.User, error) {
	rows, err := s.DB.Query(`
		SELECT DISTINCT u.id, u.nickname, u.first_name, u.last_name, u.email, u.avatar, u.is_private
		FROM users u
		WHERE u.id != ? AND (
			-- Users with public profiles
			u.is_private = 0
			OR
			-- Users that follow the current user
			EXISTS (
				SELECT 1 FROM follow_requests fr1 
				WHERE fr1.requester_id = u.id AND fr1.target_id = ? AND fr1.status = 'accepted'
			)
			OR
			-- Users that the current user follows
			EXISTS (
				SELECT 1 FROM follow_requests fr2 
				WHERE fr2.requester_id = ? AND fr2.target_id = u.id AND fr2.status = 'accepted'
			)
		)
		ORDER BY u.nickname ASC
	`, userID, userID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var user models.User
		err := rows.Scan(
			&user.ID,
			&user.Nickname,
			&user.FirstName,
			&user.LastName,
			&user.Email,
			&user.Avatar,
			&user.IsPrivate,
		)
		if err != nil {
			return nil, err
		}
		users = append(users, user)
	}
	return users, nil
}
