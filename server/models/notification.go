package models

import "time"

type Notification struct {
	ID int64 `json:"id"`
	// Link to Group invitation or Join/Follow request
	ExternalID string    `json:"external_id,omitempty"`
	UserID     int64     `json:"user_id"`
	Type       string    `json:"type"`
	NotifID    int64     `json:"notif_id"`
	Data       string    `json:"data"`
	IsRead     bool      `json:"is_read"`
	CreatedAt  time.Time `json:"created_at"`
}
