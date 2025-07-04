package models

import "time"

type CreateNotificationRequest struct {
	UserID     int64  `json:"user_id"`
	Type       string `json:"type"`
	NotifID    int64  `json:"notif_id"`
	ExternalID string `json:"external_id,omitempty"`
	Data       string `json:"data"`
}

type UpdateNotificationRequest struct {
	ID     int64 `json:"id"`
	IsRead bool  `json:"is_read"`
}

type NotificationResponse struct {
	ID         int64     `json:"id"`
	UserID     int64     `json:"user_id"`
	Type       string    `json:"type"`
	NotifID    int64     `json:"notif_id"`
	ExternalID string    `json:"external_id,omitempty"`
	Data       string    `json:"data"`
	IsRead     bool      `json:"is_read"`
	CreatedAt  time.Time `json:"created_at"`
}

type DeleteNotificationRequest struct {
	ID int64 `json:"id"`
}
