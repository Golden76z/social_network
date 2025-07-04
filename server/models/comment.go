package models

type Comment struct {
	ID        int64  `json:"id"`
	PostID    int64  `json:"post_id"`
	UserID    int64  `json:"user_id"`
	Body      string `json:"body"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at,omitempty"`
}

type CreateCommentRequest struct {
	PostID int64  `json:"post_id"`
	UserID int64  `json:"user_id"`
	Body   string `json:"body"`
}

type UpdateCommentRequest struct {
	Body *string `json:"body"`
}

type DeleteCommentRequest struct {
	ID int64 `json:"id"`
}
