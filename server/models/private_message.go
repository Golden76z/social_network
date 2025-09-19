package models

type PrivateMessage struct {
	ID         int64  `json:"id"`
	SenderID   int64  `json:"sender_id"`
	ReceiverID int64  `json:"receiver_id"`
	Body       string `json:"body"`
	CreatedAt  string `json:"created_at"`
}

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
