package models

type EventRSVP struct {
    ID        int64
    EventID   int64
    UserID    int64
    Status    string
    CreatedAt string // ou time.Time
}