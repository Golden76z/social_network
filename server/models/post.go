package models

type Post struct {
	ID         int64  `json:"id"`
	UserID     int64  `json:"user_id"`
	Title      string `json:"title"`
	Body       string `json:"body"`
	Images      []string `json:"images,omitempty"`
	Visibility string `json:"visibility"`
	CreatedAt  string `json:"created_at"`
	UpdatedAt  string `json:"updated_at,omitempty"`
}

// Create request (client → server)
type CreatePostRequest struct {
	Title      string `json:"title"`
	Body       string `json:"body"`
	Images      []string `json:"images,omitempty"`
	Visibility string `json:"visibility"`
}

// Update request (client → server)
type UpdatePostRequest struct {
	Title      *string `json:"title,omitempty"`
	Body       *string `json:"body,omitempty"`
	Images      *[]string `json:"images,omitempty"`
	Visibility *string `json:"visibility,omitempty"`
}

type DeletePostRequest struct {
	ID int64 `json:"id"`
}
// PostImageRequest is used to upload an image for a post
type PostImagesRequest struct {
	ID     int64  `json:"id"`
	UserID int64  `json:"user_id"`
	Image  []string `json:"images"`
}