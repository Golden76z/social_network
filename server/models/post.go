package models

import (
	"database/sql"
	"encoding/json"
	"fmt"
)

type Post struct {
	ID              int64    `json:"id"`
	UserID          int64    `json:"user_id"`
	Title           string   `json:"title"`
	Body            string   `json:"body"`
	Images          []string `json:"images"`
	Visibility      string   `json:"visibility"`
	CreatedAt       string   `json:"created_at"`
	UpdatedAt       string   `json:"updated_at,omitempty"`
	Likes           int      `json:"likes"`
	Dislikes        int      `json:"dislikes"`
	UserLiked       bool     `json:"user_liked"`
	UserDisliked    bool     `json:"user_disliked"`
	AuthorNickname  string   `json:"author_nickname"`
	AuthorFirstName string   `json:"author_first_name"`
	AuthorLastName  string   `json:"author_last_name"`
	AuthorAvatar    string   `json:"author_avatar"`
}

// Create request (client → server)
type CreatePostRequest struct {
	Title      string   `json:"title"`
	Body       string   `json:"body"`
	Images     []string `json:"images,omitempty"`
	Visibility string   `json:"visibility"`
	// Selected followers for private posts (only used when visibility is "private")
	SelectedFollowers []int64 `json:"selected_followers,omitempty"`
}

func (c *CreatePostRequest) UnmarshalJSON(data []byte) error {
	type Alias CreatePostRequest
	aux := &struct {
		Image json.RawMessage `json:"image,omitempty"`
		*Alias
	}{
		Alias: (*Alias)(c),
	}

	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}

	if aux.Image != nil {
		var singleImage string
		if err := json.Unmarshal(aux.Image, &singleImage); err == nil {
			c.Images = []string{singleImage}
			return nil
		}

		var multipleImages []string
		if err := json.Unmarshal(aux.Image, &multipleImages); err == nil {
			c.Images = multipleImages
			return nil
		}
		return fmt.Errorf("failed to unmarshal image field")
	}

	return nil
}

// Update request (client → server)
type UpdatePostRequest struct {
	Title      *string   `json:"title,omitempty"`
	Body       *string   `json:"body,omitempty"`
	Images     *[]string `json:"images,omitempty"`
	Visibility *string   `json:"visibility,omitempty"`
}

type DeletePostRequest struct {
	ID int64 `json:"id"`
}

// PostResponse is the structure for a post returned by the API, including author and group details.
type PostResponse struct {
	ID             int64          `json:"id"`
	PostType       string         `json:"post_type"` // "user_post" or "group_post"
	AuthorID       int64          `json:"author_id"`
	AuthorNickname string         `json:"author_nickname"`
	AuthorAvatar   sql.NullString `json:"author_avatar"`
	Title          string         `json:"title"`
	Body           string         `json:"body"`
	Visibility     string         `json:"visibility"`
	CreatedAt      string         `json:"created_at"`
	UpdatedAt      sql.NullString `json:"updated_at"`
	Images         []string       `json:"images"`
	Likes          int            `json:"likes"`
	Dislikes       int            `json:"dislikes"`
	UserLiked      bool           `json:"user_liked"`
	UserDisliked   bool           `json:"user_disliked"`
	GroupID        *int64         `json:"group_id,omitempty"`
	GroupName      *string        `json:"group_name,omitempty"`
}
