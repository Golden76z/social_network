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
	ID              int64    `json:"id"`
	UserID          int64    `json:"user_id"`
	Title           string   `json:"title"`
	Body            string   `json:"body"`
	CreatedAt       string   `json:"created_at"`
	UpdatedAt       string   `json:"updated_at"`
	Visibility      string   `json:"visibility"`
	Images          []string `json:"images"`
	Likes           int      `json:"likes"`
	Dislikes        int      `json:"dislikes"`
	UserLiked       bool     `json:"user_liked"`
	UserDisliked    bool     `json:"user_disliked"`
	AuthorNickname  string   `json:"author_nickname,omitempty"`
	AuthorFirstName string   `json:"author_first_name,omitempty"`
	AuthorLastName  string   `json:"author_last_name,omitempty"`
	AuthorAvatar    string   `json:"author_avatar,omitempty"`
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

// GroupInvitation represents a group invitation in the database
type GroupInvitation struct {
	ID            int64  `json:"id"`
	GroupID       int64  `json:"group_id"`
	InvitedUserID int64  `json:"invited_user_id"`
	InvitedBy     int64  `json:"invited_by"`
	Status        string `json:"status"`
	CreatedAt     string `json:"created_at"`
}

type InviteToGroupRequest struct {
	GroupID int64 `json:"group_id"`
	UserID  int64 `json:"user_id"`
	// InvitedBy int64 `json:"invited_by"`
}

type LeaveGroupRequest struct {
	GroupID int64 `json:"group_id"`
	UserID  int64 `json:"user_id"`
}

type UpdateGroupMemberRequest struct {
	GroupID  int64  `json:"groupID"`
	MemberID int64  `json:"memberID"`
	Role     string `json:"role"`
}

// GroupMember represents a group member in the database
type GroupMember struct {
	ID        int64  `json:"id"`
	GroupID   int64  `json:"group_id"`
	UserID    int64  `json:"user_id"`
	Role      string `json:"role"`
	InvitedBy *int64 `json:"invited_by,omitempty"`
	CreatedAt string `json:"created_at"`
}

// GroupMemberWithUser represents a group member with user information
type GroupMemberWithUser struct {
	ID        int64  `json:"id"`
	GroupID   int64  `json:"group_id"`
	UserID    int64  `json:"user_id"`
	Role      string `json:"role"`
	InvitedBy *int64 `json:"invited_by,omitempty"`
	CreatedAt string `json:"created_at"`
	Nickname  string `json:"nickname,omitempty"`
	FirstName string `json:"first_name,omitempty"`
	LastName  string `json:"last_name,omitempty"`
	Avatar    string `json:"avatar,omitempty"`
}

// GroupRequestWithUser represents a group request with user information
type GroupRequestWithUser struct {
	ID        int64  `json:"id"`
	GroupID   int64  `json:"group_id"`
	UserID    int64  `json:"user_id"`
	Status    string `json:"status"`
	CreatedAt string `json:"created_at"`
	Nickname  string `json:"nickname,omitempty"`
	FirstName string `json:"first_name,omitempty"`
	LastName  string `json:"last_name,omitempty"`
	Avatar    string `json:"avatar,omitempty"`
}

// ===== RSVP =====

type RSVPToEventRequest struct {
	EventID int64  `json:"event_id"`
	UserID  int64  `json:"user_id"`
	Status  string `json:"status"` // "come", "interested", "not_come"
}

type CancelRSVPRequest struct {
	EventID int64  `json:"event_id"`
	UserID  int64  `json:"user_id"`
	Status  string `json:"status"`
}
