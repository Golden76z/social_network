package models

type LikeDislike struct {
    ID            int64
    UserID        int64
    PostID        *int64
    CommentID     *int64
    GroupPostID   *int64
    GroupCommentID *int64
    Type          string
    CreatedAt     string // ou time.Time
}