package models

type GroupInvitation struct {
    ID            int64
    GroupID       int64
    InvitedUserID int64
    InvitedBy     int64
    Status        string
    CreatedAt     string // ou time.Time
}