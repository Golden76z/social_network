package models

import "time"

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

type DeleteGroupRequest struct {
	ID int64 `json:"id"`
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
}

type GroupPost struct {
	ID         int64
	UserID     int64
	Title      string
	Body       string
	Images     []string
	Visibility string
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

type UpdateGroupPostRequest struct {
	ID    int64   `json:"id"`
	Title *string `json:"title,omitempty"`
	Body  *string `json:"body,omitempty"`
}

type DeleteGroupPostRequest struct {
	ID int64 `json:"id"`
}

// ===== GROUP COMMENT =====

type CreateGroupCommentRequest struct {
	GroupPostID int64  `json:"group_post_id"`
	Body        string `json:"body"`
}

type UpdateGroupCommentRequest struct {
	ID   int64   `json:"id"`
	Body *string `json:"body,omitempty"`
}

type DeleteGroupCommentRequest struct {
	ID int64 `json:"id"`
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

type DeleteGroupEventRequest struct {
	ID int64 `json:"id"`
}

// ===== GROUP MEMBER / INVITATION =====

type InviteToGroupRequest struct {
	GroupID int64 `json:"group_id"`
	UserID  int64 `json:"user_id"`
	// InvitedBy int64 `json:"invited_by"`
}

type LeaveGroupRequest struct {
	GroupID int64 `json:"group_id"`
	// UserID  int64 `json:"user_id"`
}

type UpdateGroupMemberRequest struct {
	GroupID int64  `json:"groupID"`
	Status  string `json:"status"`
}

// GroupMember represents a group member in the database
type GroupMember struct {
	ID        int64  `json:"id"`
	GroupID   int64  `json:"group_id"`
	UserID    int64  `json:"user_id"`
	Role      string `json:"role"`
	Status    string `json:"status"`
	InvitedBy *int64 `json:"invited_by,omitempty"`
	CreatedAt string `json:"created_at"`
}

// ===== RSVP =====

type RSVPToEventRequest struct {
	EventID int64  `json:"event_id"`
	UserID  int64  `json:"user_id"`
	Status  string `json:"status"` // "going", "interested", "not_going"
}

type CancelRSVPRequest struct {
	EventID int64 `json:"event_id"`
	UserID  int64 `json:"user_id"`
}
