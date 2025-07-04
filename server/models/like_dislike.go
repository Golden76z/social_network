package models

type LikeDislike struct {
	ID             int64  `json:"id"`
	UserID         int64  `json:"user_id"`
	PostID         *int64 `json:"post_id,omitempty"`
	CommentID      *int64 `json:"comment_id,omitempty"`
	GroupPostID    *int64 `json:"group_post_id,omitempty"`
	GroupCommentID *int64 `json:"group_comment_id,omitempty"`
	Type           string `json:"type"`
	CreatedAt      string `json:"created_at"`
}
