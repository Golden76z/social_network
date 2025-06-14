package models

type GroupPost struct {
    ID        int64
    GroupID   int64
    UserID    int64
    Title     string
    Body      string
    Image     string
    CreatedAt string // ou time.Time
    UpdatedAt string // ou time.Time
}