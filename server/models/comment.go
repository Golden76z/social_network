package models

type Comment struct {
	ID        int64  `json:"id,omitempty"`
	PostID    int64  `json:"post_id,omitempty"`
	UserID    int64  `json:"user_id,omitempty"`
	Body      string `json:"body,omitempty"`
	CreatedAt string `json:"created_at,omitempty"`
	UpdatedAt string `json:"updated_at,omitempty"`
}
