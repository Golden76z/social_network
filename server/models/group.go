package models

type Group struct {
    ID        int64
    Title     string
    Avatar    string
    Bio       string
    CreatorID int64
    CreatedAt string // ou time.Time
    UpdatedAt string // ou time.Time
}