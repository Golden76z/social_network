package models

type GroupComment struct {
    ID          int64
    GroupPostID int64
    UserID      int64
    Body        string
    Image       string
    CreatedAt   string // ou time.Time
    UpdatedAt   string // ou time.Time
}