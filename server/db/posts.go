package db

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/Golden76z/social-network/models"
)

func (s *Service) CreatePost(userID int64, req models.CreatePostRequest) (int64, error) {
	tx, err := s.DB.Begin()
	if err != nil {
		return 0, err
	}

	result, err := tx.Exec(`
        INSERT INTO posts (user_id, title, body, visibility)
        VALUES (?, ?, ?, ?)`,
		userID, req.Title, req.Body, req.Visibility)
	if err != nil {
		tx.Rollback()
		return 0, err
	}

	postID, err := result.LastInsertId()
	if err != nil {
		tx.Rollback()
		return 0, err
	}

	for _, imageURL := range req.Images {
		_, err := tx.Exec(`
            INSERT INTO post_images (post_id, image_url)
            VALUES (?, ?)`,
			postID, imageURL)
		if err != nil {
			tx.Rollback()
			return 0, err
		}
	}

	return postID, tx.Commit()
}

func (s *Service) InsertPostImage(postID int, isGroupPost bool, imageURL string) error {
	_, err := s.DB.Exec(`
		INSERT INTO post_images (post_id, is_group_post, image_url)
		VALUES (?, ?, ?)`,
		postID, isGroupPost, imageURL)
	return err
}

func (s *Service) GetPostByID(postID int64, currentUserID int64) (*models.PostResponse, error) {
	query := `
        SELECT
            p.id,
            'user_post' AS post_type,
            p.user_id AS author_id,
            u.nickname AS author_nickname,
            u.avatar AS author_avatar,
            p.title,
            p.body,
            p.created_at,
            p.updated_at,
            GROUP_CONCAT(pi.image_url) AS images,
            p.visibility
        FROM
            posts p
        JOIN
            users u ON p.user_id = u.id
        LEFT JOIN
            post_images pi ON p.id = pi.post_id AND pi.is_group_post = 0
        WHERE
            p.id = ?
        GROUP BY
            p.id`

	row := s.DB.QueryRow(query, postID)

	var post models.PostResponse
	var images sql.NullString
	var visibility string

	err := row.Scan(
		&post.ID,
		&post.PostType,
		&post.AuthorID,
		&post.AuthorNickname,
		&post.AuthorAvatar,
		&post.Title,
		&post.Body,
		&post.CreatedAt,
		&post.UpdatedAt,
		&images,
		&visibility,
	)

	if err != nil {
		return nil, err
	}

	if images.Valid {
		post.Images = strings.Split(images.String, ",")
	}

	if visibility == "private" && post.AuthorID != currentUserID {
		isFollowing, err := s.IsFollowing(currentUserID, post.AuthorID)
		if err != nil {
			return nil, err
		}
		if !isFollowing {
			return nil, fmt.Errorf("unauthorized")
		}
	}

	return &post, nil
}

//func (s *Service) GetUserFeed(currentUserID, limit, offset int) ([]models.PostResponse, error) {
//	query := `
//        SELECT * FROM (
//            SELECT
//                p.id,
//                'user_post' AS post_type,
//                p.user_id AS author_id,
//                u.nickname AS author_nickname,
//                u.avatar AS author_avatar,
//                p.title,
//                p.body,
//                p.created_at,
//                p.updated_at,
//                GROUP_CONCAT(pi.image_url) AS images,
//                NULL AS group_id,
//                NULL AS group_name
//            FROM
//                posts p
//            JOIN
//                users u ON p.user_id = u.id
//            LEFT JOIN
//                post_images pi ON p.id = pi.post_id AND pi.is_group_post = 0
//            WHERE
//                p.visibility = 'public'
//                OR p.user_id = ?
//                OR (p.visibility = 'private' AND EXISTS (
//                    SELECT 1 FROM follow_requests
//                    WHERE requester_id = ? AND target_id = p.user_id AND status = 'accepted'
//                ))
//            GROUP BY p.id
//
//            UNION ALL
//
//            SELECT
//                gp.id,
//                'group_post' AS post_type,
//                gp.user_id AS author_id,
//                u.nickname AS author_nickname,
//                u.avatar AS author_avatar,
//                gp.title,
//                gp.body,
//                gp.created_at,
//                gp.updated_at,
//                GROUP_CONCAT(pi.image_url) AS images,
//                g.id AS group_id,
//                g.title AS group_name
//            FROM
//                group_posts gp
//            JOIN
//                users u ON gp.user_id = u.id
//            JOIN
//                groups g ON gp.group_id = g.id
//            LEFT JOIN
//                post_images pi ON gp.id = pi.post_id AND pi.is_group_post = 1
//            WHERE
//                EXISTS (
//                    SELECT 1 FROM group_members
//                    WHERE group_id = gp.group_id AND user_id = ? AND status = 'accepted'
//                )
//            GROUP BY gp.id
//        ) AS feed
//        ORDER BY
//            feed.created_at DESC
//        LIMIT ?
//        OFFSET ?`
//
//	rows, err := s.DB.Query(query, currentUserID, currentUserID, currentUserID, limit, offset)
//	if err != nil {
//		return nil, err
//	}
//	defer rows.Close()
//
//	var posts []models.PostResponse
//
//	for rows.Next() {
//		var post models.PostResponse
//		var images sql.NullString
//
//		err := rows.Scan(
//			&post.ID,
//			&post.PostType,
//			&post.AuthorID,
//			&post.AuthorNickname,
//			&post.AuthorAvatar,
//			&post.Title,
//			&post.Body,
//			&post.CreatedAt,
//			&post.UpdatedAt,
//			&images,
//			&post.GroupID,
//			&post.GroupName,
//		)
//
//		if err != nil {
//			return nil, err
//		}
//
//		if images.Valid {
//			post.Images = strings.Split(images.String, ",")
//		}
//
//		posts = append(posts, post)
//	}
//
//	return posts, nil
//}

func (s *Service) GetUserFeed(currentUserID, limit, offset int) ([]models.PostResponse, error) {
	query := `
        SELECT * FROM (
            SELECT
                p.id,
                'user_post' AS post_type,
                p.user_id AS author_id,
                u.nickname AS author_nickname,
                u.avatar AS author_avatar,
                p.title,
                p.body,
                p.created_at,
                p.updated_at,
                GROUP_CONCAT(pi.image_url) AS images,
                NULL AS group_id,
                NULL AS group_name
            FROM
                posts p
            JOIN
                users u ON p.user_id = u.id
            LEFT JOIN
                post_images pi ON p.id = pi.post_id AND pi.is_group_post = 0
            WHERE
                p.visibility = 'public'
                OR p.user_id = ?
                OR (p.visibility = 'private' AND EXISTS (
                    SELECT 1 FROM follow_requests
                    WHERE requester_id = ? AND target_id = p.user_id AND status = 'accepted'
                ))
            GROUP BY p.id

            UNION ALL

            SELECT
                gp.id,
                'group_post' AS post_type,
                gp.user_id AS author_id,
                u.nickname AS author_nickname,
                u.avatar AS author_avatar,
                gp.title,
                gp.body,
                gp.created_at,
                gp.updated_at,
                GROUP_CONCAT(pi.image_url) AS images,
                g.id AS group_id,
                g.title AS group_name
            FROM
                group_posts gp
            JOIN
                users u ON gp.user_id = u.id
            JOIN
                groups g ON gp.group_id = g.id
            LEFT JOIN
                post_images pi ON gp.id = pi.post_id AND pi.is_group_post = 1
            WHERE
                EXISTS (
                    SELECT 1 FROM group_members
                    WHERE group_id = gp.group_id AND user_id = ?
                )
            GROUP BY gp.id
        ) AS feed
        ORDER BY
            feed.created_at DESC
        LIMIT ?
        OFFSET ?`

	rows, err := s.DB.Query(query, currentUserID, currentUserID, currentUserID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []models.PostResponse

	for rows.Next() {
		var post models.PostResponse
		var images sql.NullString

		err := rows.Scan(
			&post.ID,
			&post.PostType,
			&post.AuthorID,
			&post.AuthorNickname,
			&post.AuthorAvatar,
			&post.Title,
			&post.Body,
			&post.CreatedAt,
			&post.UpdatedAt,
			&images,
			&post.GroupID,
			&post.GroupName,
		)

		if err != nil {
			return nil, err
		}

		if images.Valid {
			post.Images = strings.Split(images.String, ",")
		}

		posts = append(posts, post)
	}

	return posts, nil
}

func (s *Service) IsFollowing(currentUserID, targetUserID int64) (bool, error) {
	query := `
        SELECT EXISTS (
            SELECT 1
            FROM follow_requests
            WHERE requester_id = ? AND target_id = ? AND status = 'accepted'
        )`

	var isFollowing bool
	err := s.DB.QueryRow(query, currentUserID, targetUserID).Scan(&isFollowing)
	if err != nil {
		return false, err
	}

	return isFollowing, nil
}

func (s *Service) UpdatePost(postID int64, req models.UpdatePostRequest) error {
	tx, err := s.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback() // Rollback on any error

	var setParts []string
	var args []interface{}

	if req.Title != nil {
		setParts = append(setParts, "title = ?")
		args = append(args, *req.Title)
	}
	if req.Body != nil {
		setParts = append(setParts, "body = ?")
		args = append(args, *req.Body)
	}
	if req.Visibility != nil {
		setParts = append(setParts, "visibility = ?")
		args = append(args, *req.Visibility)
	}

	if len(setParts) > 0 {
		setParts = append(setParts, "updated_at = CURRENT_TIMESTAMP")
		query := fmt.Sprintf("UPDATE posts SET %s WHERE id = ?", strings.Join(setParts, ", "))
		args = append(args, postID)

		_, err = tx.Exec(query, args...)
		if err != nil {
			return err
		}
	}

	if req.Images != nil {
		// Delete old images
		_, err := tx.Exec("DELETE FROM post_images WHERE post_id = ? AND is_group_post = 0", postID)
		if err != nil {
			return err
		}

		// Insert new images
		for _, imageURL := range *req.Images {
			_, err := tx.Exec("INSERT INTO post_images (post_id, is_group_post, image_url) VALUES (?, 0, ?)", postID, imageURL)
			if err != nil {
				return err
			}
		}
	}

	return tx.Commit()
}

func (s *Service) DeletePost(postID int64) error {
	tx, err := s.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback() // Rollback on any error

	// Manually delete notifications related to the post, as there's no direct CASCADE.
	// This is a simple approach; a more robust solution might involve parsing the 'data' field.
	_, err = tx.Exec(`DELETE FROM notifications WHERE data LIKE ?`, fmt.Sprintf(`%%"post_id":%d%%`, postID))
	if err != nil {
		return fmt.Errorf("failed to delete notifications: %w", err)
	}

	// Delete the post. Associated data in tables with ON DELETE CASCADE will be removed automatically.
	// This includes: comments, likes_dislikes, post_images.
	result, err := tx.Exec(`DELETE FROM posts WHERE id = ?`, postID)
	if err != nil {
		return fmt.Errorf("failed to delete post: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("post with ID %d not found", postID)
	}

	return tx.Commit()
}

func (s *Service) PostExists(postID int64) (bool, error) {
	var exists bool
	err := s.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM posts WHERE id = ?)", postID).Scan(&exists)
	return exists, err
}
