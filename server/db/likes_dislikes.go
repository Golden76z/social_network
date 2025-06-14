package db

import (
    "database/sql"
    "github.com/Golden76z/social-network/models"
)

func CreateLikeDislike(db *sql.DB, userID int64, postID, commentID, groupPostID, groupCommentID *int64, typ string) error {
    tx, err := db.Begin()
    if err != nil { return err }
    defer func() {
        if err != nil { tx.Rollback() } else { _ = tx.Commit() }
    }()
    _, err = tx.Exec(`
        INSERT INTO likes_dislikes (user_id, post_id, comment_id, group_post_id, group_comment_id, type)
        VALUES (?, ?, ?, ?, ?, ?)`, userID, postID, commentID, groupPostID, groupCommentID, typ)
    return err
}

func GetLikeDislikeByID(db *sql.DB, id int64) (*models.LikeDislike, error) {
    row := db.QueryRow(`
        SELECT id, user_id, post_id, comment_id, group_post_id, group_comment_id, type, created_at
        FROM likes_dislikes WHERE id = ?`, id)
    var ld models.LikeDislike
    err := row.Scan(&ld.ID, &ld.UserID, &ld.PostID, &ld.CommentID, &ld.GroupPostID, &ld.GroupCommentID, &ld.Type, &ld.CreatedAt)
    if err != nil { return nil, err }
    return &ld, nil
}

func DeleteLikeDislike(db *sql.DB, id int64) error {
    tx, err := db.Begin()
    if err != nil { return err }
    defer func() {
        if err != nil { tx.Rollback() } else { _ = tx.Commit() }
    }()
    _, err = tx.Exec(`DELETE FROM likes_dislikes WHERE id = ?`, id)
    return err
}