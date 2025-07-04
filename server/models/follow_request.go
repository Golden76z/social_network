package models

type FollowRequest struct {
	ID          int64  `json:"id"`
	RequesterID int64  `json:"requester_id"`
	TargetID    int64  `json:"target_id"`
	Status      string `json:"status"` // e.g., "pending", "accepted", "rejected"
	CreatedAt   string `json:"created_at"`
}

type CreateFollowRequest struct {
	RequesterID int64 `json:"requester_id"`
	TargetID    int64 `json:"target_id"`
}

type DeleteFollowRequest struct {
	RequesterID int64 `json:"requester_id"`
	TargetID    int64 `json:"target_id"`
}
