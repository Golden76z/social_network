package models

type Post struct {
	ID         int64
	UserID     int64
	Title      string
	Body       string
	Image      string
	Visibility string
	CreatedAt  string // ou time.Time si tu préfères
	UpdatedAt  string // ou time.Time
}
