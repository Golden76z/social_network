package models

type GroupMessage struct {
    ID        int64
    GroupID   int64
    SenderID  int64
    Body      string
    CreatedAt string // ou time.Time
}