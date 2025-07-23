package models

import (
	"encoding/json"
	"fmt"
)

type Post struct {
	ID         int64    `json:"id"`
	UserID     int64    `json:"user_id"`
	Title      string   `json:"title"`
	Body       string   `json:"body"`
	Images     []string `json:"images"`
	Visibility string   `json:"visibility"`
	CreatedAt  string   `json:"created_at"`
	UpdatedAt  string   `json:"updated_at,omitempty"`
}

// Create request (client → server)
type CreatePostRequest struct {
	Title      string   `json:"title"`
	Body       string   `json:"body"`
	Images     []string `json:"images,omitempty"`
	Visibility string   `json:"visibility"`
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
	Title      *string `json:"title,omitempty"`
	Body       *string `json:"body,omitempty"`
	Visibility *string `json:"visibility,omitempty"`
}

type DeletePostRequest struct {
	ID int64 `json:"id"`
}