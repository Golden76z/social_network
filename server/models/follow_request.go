package models

type FollowRequest struct {
    ID          int64
    RequesterID int64
    TargetID    int64
    Status      string
    CreatedAt   string // ou time.Time si tu préfères
}