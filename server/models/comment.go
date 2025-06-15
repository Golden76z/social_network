package models

type Comment struct {
	ID        int64
	PostID    int64
	UserID    int64
	Body      string
	CreatedAt string // ou time.Time
	UpdatedAt string // ou time.Time
}
