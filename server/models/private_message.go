package models

type PrivateMessage struct {
    ID         int64
    SenderID   int64
    ReceiverID int64
    Body       string
    CreatedAt  string // ou time.Time
}