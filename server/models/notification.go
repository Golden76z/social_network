package models

type Notification struct {
    ID        int64
    UserID    int64
    Type      string
    Data      string
    IsRead    bool
    CreatedAt string // ou time.Time
}