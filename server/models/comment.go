package models

// Comment struct - enhanced to include user details for frontend display
type Comment struct {
	ID        int64  `json:"id"`
	PostID    int64  `json:"post_id"`
	UserID    int64  `json:"user_id"`
	Body      string `json:"body"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at,omitempty"`

	// User details for frontend display (populated when fetching comments)
	Username  string `json:"username,omitempty"`
	FirstName string `json:"first_name,omitempty"`
	LastName  string `json:"last_name,omitempty"`
	Avatar    string `json:"avatar,omitempty"`

	// Images support
	Images []string `json:"images,omitempty"`
}

// Regular post comments
type CreateCommentRequest struct {
	PostID int64    `json:"post_id"`
	UserID int64    `json:"user_id"`
	Body   string   `json:"body"`
	Images []string `json:"images,omitempty"`
}

type UpdateCommentRequest struct {
	Body *string `json:"body"`
}

type DeleteCommentRequest struct {
	ID int64 `json:"id"`
}

// // Group comment specific structs
// type CreateGroupCommentRequest struct {
// 	GroupPostID int64  `json:"group_post_id"`
// 	Body        string `json:"body"`
// 	// UserID is not included here as it comes from the auth context
// }

// type UpdateGroupCommentRequest struct {
// 	Body *string `json:"body"`
// }

// Group comment response with additional context
type GroupCommentResponse struct {
	Comment
	GroupID   int64  `json:"group_id,omitempty"`   // If you need group context
	GroupName string `json:"group_name,omitempty"` // If you need group name
}

// For bulk operations or paginated responses
type CommentsResponse struct {
	Comments []Comment `json:"comments"`
	Total    int       `json:"total,omitempty"`
	Page     int       `json:"page,omitempty"`
	Limit    int       `json:"limit,omitempty"`
}
