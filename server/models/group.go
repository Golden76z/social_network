package models

// ===== GROUP =====

type CreateGroupRequest struct {
	Title  string `json:"title"`
	Avatar string `json:"avatar,omitempty"`
	Bio    string `json:"bio,omitempty"`
}

type UpdateGroupRequest struct {
	ID     int64   `json:"id"`
	Title  *string `json:"title,omitempty"`
	Avatar *string `json:"avatar,omitempty"`
	Bio    *string `json:"bio,omitempty"`
}

type GroupResponse struct {
	ID        int64  `json:"id"`
	Title     string `json:"title"`
	Avatar    string `json:"avatar,omitempty"`
	Bio       string `json:"bio,omitempty"`
	CreatorID int64  `json:"creator_id"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at,omitempty"`
}

// ===== GROUP POST =====

type CreateGroupPostRequest struct {
	GroupID int64  `json:"group_id"`
	Title   string `json:"title"`
	Body    string `json:"body"`
	Image   string `json:"image,omitempty"`
}

type UpdateGroupPostRequest struct {
	ID    int64   `json:"id"`
	Title *string `json:"title,omitempty"`
	Body  *string `json:"body,omitempty"`
	Image *string `json:"image,omitempty"`
}

// ===== GROUP COMMENT =====

type CreateGroupCommentRequest struct {
	GroupPostID int64  `json:"group_post_id"`
	Body        string `json:"body"`
	Image       string `json:"image,omitempty"`
}

type UpdateGroupCommentRequest struct {
	ID    int64   `json:"id"`
	Body  *string `json:"body,omitempty"`
	Image *string `json:"image,omitempty"`
}

// ===== GROUP EVENT =====

type CreateGroupEventRequest struct {
	GroupID       int64  `json:"group_id"`
	Title         string `json:"title"`
	Description   string `json:"description"`
	EventDateTime string `json:"event_date_time"`
}

type UpdateGroupEventRequest struct {
	ID            int64   `json:"id"`
	Title         *string `json:"title,omitempty"`
	Description   *string `json:"description,omitempty"`
	EventDateTime *string `json:"event_date_time,omitempty"`
}

// ===== GROUP MEMBER / INVITATION =====

type InviteToGroupRequest struct {
	GroupID   int64 `json:"group_id"`
	UserID    int64 `json:"user_id"`
	InvitedBy int64 `json:"invited_by"`
}

type LeaveGroupRequest struct {
	GroupID int64 `json:"group_id"`
	UserID  int64 `json:"user_id"`
}

// ===== RSVP =====

type RSVPToEventRequest struct {
	EventID int64 `json:"event_id"`
	UserID  int64 `json:"user_id"`
	// "going", "interested", "not_going"
	Status string `json:"status"`
}
