package models

type Group struct {
	ID        int64  `json:"id"`
	Title     string `json:"title"`
	Avatar    string `json:"avatar,omitempty"`
	Bio       string `json:"bio,omitempty"`
	CreatorID int64  `json:"creator_id"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at,omitempty"`
}

type GroupInvitation struct {
	ID            int64  `json:"id"`
	GroupID       int64  `json:"group_id"`
	InvitedUserID int64  `json:"invited_user_id"`
	InvitedBy     int64  `json:"invited_by"`
	Status        string `json:"status"`
	CreatedAt     string `json:"created_at"`
}

type GroupRequest struct {
	ID        int64  `json:"id"`
	GroupID   int64  `json:"group_id"`
	UserID    int64  `json:"user_id"`
	Status    string `json:"status"`
	CreatedAt string `json:"created_at"`
}

type GroupMember struct {
	ID        int64  `json:"id"`
	GroupID   int64  `json:"group_id"`
	UserID    int64  `json:"user_id"`
	Role      string `json:"role"`
	Status    string `json:"status"`
	InvitedBy *int64 `json:"invited_by,omitempty"`
	CreatedAt string `json:"created_at"`
}

type GroupPost struct {
	ID        int64  `json:"id"`
	GroupID   int64  `json:"group_id"`
	UserID    int64  `json:"user_id"`
	Title     string `json:"title"`
	Body      string `json:"body"`
	Image     string `json:"image,omitempty"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at,omitempty"`
}

type GroupComment struct {
	ID          int64  `json:"id"`
	GroupPostID int64  `json:"group_post_id"`
	UserID      int64  `json:"user_id"`
	Body        string `json:"body"`
	Image       string `json:"image,omitempty"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at,omitempty"`
}

type GroupMessage struct {
	ID        int64  `json:"id"`
	GroupID   int64  `json:"group_id"`
	SenderID  int64  `json:"sender_id"`
	Body      string `json:"body"`
	CreatedAt string `json:"created_at"`
}

type GroupEvent struct {
	ID            int64  `json:"id"`
	GroupID       int64  `json:"group_id"`
	CreatorID     int64  `json:"creator_id"`
	Title         string `json:"title"`
	Description   string `json:"description"`
	EventDateTime string `json:"event_date_time"`
	CreatedAt     string `json:"created_at"`
}

type EventRSVP struct {
	ID        int64  `json:"id"`
	EventID   int64  `json:"event_id"`
	UserID    int64  `json:"user_id"`
	Status    string `json:"status"`
	CreatedAt string `json:"created_at"`
}
