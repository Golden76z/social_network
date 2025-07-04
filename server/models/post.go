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

// Create request (client → server)
type CreatePostRequest struct {
	Title      string `json:"title"`
	Body       string `json:"body"`
	Image      string `json:"image,omitempty"`
	Visibility string `json:"visibility"`
}

// Update request (client → server)
type UpdatePostRequest struct {
	Title      *string `json:"title,omitempty"`
	Body       *string `json:"body,omitempty"`
	Image      *string `json:"image,omitempty"`
	Visibility *string `json:"visibility,omitempty"`
}
