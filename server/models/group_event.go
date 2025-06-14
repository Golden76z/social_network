package models

type GroupEvent struct {
    ID           int64
    GroupID      int64
    CreatorID    int64
    Title        string
    Description  string
    EventDateTime string // ou time.Time
    CreatedAt    string // ou time.Time
}