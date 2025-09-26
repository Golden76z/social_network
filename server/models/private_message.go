package models

type PrivateMessage struct {
	ID         int    `json:"id"`
	SenderID   int    `json:"sender_id"`
	ReceiverID int    `json:"receiver_id"`
	Body       string `json:"body"`
	CreatedAt  string `json:"created_at"`
}
