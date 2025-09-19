package models

type PrivateMessage struct {
	ID         int64  `json:"id"`
	SenderID   int64  `json:"sender_id"`
	ReceiverID int64  `json:"receiver_id"`
	Body       string `json:"body"`
	CreatedAt  string `json:"created_at"`
}
