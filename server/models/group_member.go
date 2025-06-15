package models

type GroupMember struct {
    ID        int64
    GroupID   int64
    UserID    int64
    Role      string
    Status    string
    InvitedBy *int64 // Peut être NULL
    CreatedAt string // ou time.Time
}