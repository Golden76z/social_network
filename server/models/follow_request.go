package models

type FollowRequest struct {
	ID          int64  `json:"id"`
	RequesterID int64  `json:"requester_id"`
	TargetID    int64  `json:"target_id"`
	Status      string `json:"status"`
	CreatedAt   string `json:"created_at"`
}
