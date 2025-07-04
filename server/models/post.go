package models

type Post struct {
	ID         int64  `json:"id"`
	UserID     int64  `json:"user_id"`
	Title      string `json:"title"`
	Body       string `json:"body"`
	Image      string `json:"image,omitempty"`
	Visibility string `json:"visibility"`
	CreatedAt  string `json:"created_at"`
	UpdatedAt  string `json:"updated_at,omitempty"`
}

type PostVisibility struct {
	ID     int64 `json:"id"`
	PostID int64 `json:"post_id"`
	UserID int64 `json:"user_id"`
}
