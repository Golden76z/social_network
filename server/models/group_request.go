package models

type GroupRequest struct {
    ID        int64
    GroupID   int64
    UserID    int64
    Status    string
    CreatedAt string // ou time.Time
}