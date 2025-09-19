package db

import (
	"github.com/Golden76z/social-network/models"
)

// GetConversations retrieves all conversations for a user
func (s *Service) GetConversations(userID int64) ([]Conversation, error) {
	query := `
		SELECT DISTINCT 
			CASE 
				WHEN pm.sender_id = ? THEN pm.receiver_id
				ELSE pm.sender_id
			END as other_user_id,
			u.nickname as other_user_nickname,
			u.first_name as other_user_first_name,
			u.last_name as other_user_last_name,
			u.avatar as other_user_avatar,
			u.is_private as other_user_is_private,
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
	`

	rows, err := s.DB.Query(query, userID, userID, userID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var conversations []Conversation
	for rows.Next() {
		var conv Conversation
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

// GetMessagesBetweenUsers retrieves messages between two users with pagination
func (s *Service) GetMessagesBetweenUsers(userID1, userID2 int64, limit, offset int) ([]models.PrivateMessage, error) {
	query := `
		SELECT id, sender_id, receiver_id, body, created_at
		FROM private_messages
		WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := s.DB.Query(query, userID1, userID2, userID2, userID1, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []models.PrivateMessage
	for rows.Next() {
		var msg models.PrivateMessage
		err := rows.Scan(
			&msg.ID,
			&msg.SenderID,
			&msg.ReceiverID,
			&msg.Body,
			&msg.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}

	return messages, nil
}

// CheckCanSendMessage checks if a user can send a message to another user
func (s *Service) CheckCanSendMessage(senderID, receiverID int64) (bool, error) {
	// For now, allow all users to send messages to each other
	// In the future, this could check for blocking, privacy settings, etc.
	return true, nil
}

// CheckGroupMembership checks if a user is a member of a group
func (s *Service) CheckGroupMembership(userID, groupID int64) (bool, error) {
	var count int
	query := `SELECT COUNT(*) FROM group_members WHERE user_id = ? AND group_id = ?`
	err := s.DB.QueryRow(query, userID, groupID).Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

// GetGroupMessages retrieves messages for a group with pagination
func (s *Service) GetGroupMessages(groupID int64, limit, offset int) ([]GroupMessage, error) {
	query := `
		SELECT gm.id, gm.group_id, gm.sender_id, gm.body, gm.created_at
		FROM group_messages gm
		WHERE gm.group_id = ?
		ORDER BY gm.created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := s.DB.Query(query, groupID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []GroupMessage
	for rows.Next() {
		var msg GroupMessage
		err := rows.Scan(
			&msg.ID,
			&msg.GroupID,
			&msg.SenderID,
			&msg.Body,
			&msg.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}

	return messages, nil
}

// GetMessageableUsers retrieves users that the current user can message
func (s *Service) GetMessageableUsers(userID int64) ([]models.User, error) {
	query := `
		SELECT id, email, first_name, last_name, nickname, avatar, is_private
		FROM users
		WHERE id != ?
		ORDER BY nickname ASC
	`

	rows, err := s.DB.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var user models.User
		err := rows.Scan(
			&user.ID,
			&user.Email,
			&user.FirstName,
			&user.LastName,
			&user.Nickname,
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

// Conversation represents a conversation between two users
type Conversation struct {
	OtherUserID        int64  `json:"other_user_id"`
	OtherUserNickname  string `json:"other_user_nickname"`
	OtherUserFirstName string `json:"other_user_first_name"`
	OtherUserLastName  string `json:"other_user_last_name"`
	OtherUserAvatar    string `json:"other_user_avatar"`
	OtherUserIsPrivate bool   `json:"other_user_is_private"`
	LastMessage        string `json:"last_message"`
	LastMessageTime    string `json:"last_message_time"`
}
