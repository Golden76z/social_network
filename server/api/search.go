package api

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/Golden76z/social-network/db"
	"github.com/Golden76z/social-network/middleware"
	"github.com/Golden76z/social-network/models"
)

// SearchUsersHandler handles user search requests
func SearchUsersHandler(w http.ResponseWriter, r *http.Request) {
	// Get current user from context
	_, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "User not authenticated", http.StatusUnauthorized)
		return
	}

	// Get query parameter
	query := r.URL.Query().Get("q")
	if query == "" {
		http.Error(w, "Query parameter 'q' is required", http.StatusBadRequest)
		return
	}

	// Get limit parameter (default 10, max 50)
	limit := 10
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 && parsedLimit <= 50 {
			limit = parsedLimit
		}
	}

	// Search users in database
	users, err := searchUsersInDB(query, limit)
	if err != nil {
		http.Error(w, "Failed to search users", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(users)
}

// SearchGroupsHandler handles group search requests
func SearchGroupsHandler(w http.ResponseWriter, r *http.Request) {
	// Get current user from context
	currentUserID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "User not authenticated", http.StatusUnauthorized)
		return
	}

	// Get query parameter
	query := r.URL.Query().Get("q")
	if query == "" {
		http.Error(w, "Query parameter 'q' is required", http.StatusBadRequest)
		return
	}

	// Get limit parameter (default 10, max 50)
	limit := 10
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 && parsedLimit <= 50 {
			limit = parsedLimit
		}
	}

	// Search groups in database
	groups, err := searchGroupsInDB(query, int64(currentUserID), limit)
	if err != nil {
		http.Error(w, "Failed to search groups", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(groups)
}

// SearchPostsHandler handles post search requests
func SearchPostsHandler(w http.ResponseWriter, r *http.Request) {
	// Get current user from context
	currentUserID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "User not authenticated", http.StatusUnauthorized)
		return
	}

	// Get query parameter
	query := r.URL.Query().Get("q")
	if query == "" {
		http.Error(w, "Query parameter 'q' is required", http.StatusBadRequest)
		return
	}

	// Get limit parameter (default 10, max 50)
	limit := 10
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 && parsedLimit <= 50 {
			limit = parsedLimit
		}
	}

	// Search posts in database
	posts, err := searchPostsInDB(query, int64(currentUserID), limit)
	if err != nil {
		http.Error(w, "Failed to search posts", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(posts)
}

// Helper function to search users in database
func searchUsersInDB(query string, limit int) ([]models.UserSearchResult, error) {
	var users []models.UserSearchResult

	// Search in nickname, first_name, and last_name
	searchQuery := `
		SELECT id, nickname, first_name, last_name, avatar, is_private
		FROM users
		WHERE (nickname LIKE ? OR first_name LIKE ? OR last_name LIKE ?)
		ORDER BY 
			CASE 
				WHEN nickname LIKE ? THEN 1
				WHEN first_name LIKE ? THEN 2
				WHEN last_name LIKE ? THEN 3
				ELSE 4
			END,
			nickname ASC
		LIMIT ?
	`

	searchPattern := "%" + query + "%"
	exactPattern := query + "%"

	rows, err := db.DBService.DB.Query(searchQuery, searchPattern, searchPattern, searchPattern, exactPattern, exactPattern, exactPattern, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var user models.UserSearchResult
		var avatar sql.NullString

		err := rows.Scan(
			&user.ID,
			&user.Nickname,
			&user.FirstName,
			&user.LastName,
			&avatar,
			&user.IsPrivate,
		)
		if err != nil {
			return nil, err
		}

		if avatar.Valid {
			user.Avatar = avatar.String
		}

		users = append(users, user)
	}

	return users, nil
}

// Helper function to search groups in database
func searchGroupsInDB(query string, currentUserID int64, limit int) ([]models.GroupSearchResult, error) {
	var groups []models.GroupSearchResult

	// Search in title and bio, considering user membership
	searchQuery := `
		SELECT g.id, g.title, g.bio, g.avatar,
		       EXISTS(
		         SELECT 1 FROM group_members WHERE group_id = g.id AND user_id = ?
		         UNION
		         SELECT 1 FROM group_requests WHERE group_id = g.id AND user_id = ? AND status = 'accepted'
		       ) AS is_member
		FROM groups g
		WHERE (g.title LIKE ? OR g.bio LIKE ?)
		ORDER BY 
			CASE 
				WHEN g.title LIKE ? THEN 1
				WHEN g.bio LIKE ? THEN 2
				ELSE 3
			END,
			g.title ASC
		LIMIT ?
	`

	searchPattern := "%" + query + "%"
	exactPattern := query + "%"

	rows, err := db.DBService.DB.Query(searchQuery, currentUserID, currentUserID, searchPattern, searchPattern, exactPattern, exactPattern, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var group models.GroupSearchResult
		var avatar sql.NullString
		var isMember bool

		err := rows.Scan(
			&group.ID,
			&group.Title,
			&group.Bio,
			&avatar,
			&isMember,
		)
		if err != nil {
			return nil, err
		}

		if avatar.Valid {
			group.Avatar = avatar.String
		}

		group.IsMember = &isMember
		groups = append(groups, group)
	}

	// Return empty array if no results found
	if groups == nil {
		groups = []models.GroupSearchResult{}
	}

	return groups, nil
}

// Helper function to search posts in database
func searchPostsInDB(query string, currentUserID int64, limit int) ([]models.PostResponse, error) {
	var posts []models.PostResponse

	// Search in title and body, considering visibility and user permissions
	searchQuery := `
		SELECT p.id, p.title, p.body, p.user_id, p.created_at, p.updated_at,
			   u.nickname, u.first_name, u.last_name, u.avatar, p.visibility
		FROM posts p
		JOIN users u ON p.user_id = u.id
		WHERE (p.title LIKE ? OR p.body LIKE ?)
		  AND (
		    p.visibility = 'public' 
		    OR p.user_id = ?
		    OR (p.visibility = 'private' AND EXISTS (
		      SELECT 1 FROM follow_requests 
		      WHERE requester_id = ? AND target_id = p.user_id AND status = 'accepted'
		    ))
		  )
		ORDER BY 
			CASE 
				WHEN p.title LIKE ? THEN 1
				WHEN p.body LIKE ? THEN 2
				ELSE 3
			END,
			p.created_at DESC
		LIMIT ?
	`

	searchPattern := "%" + query + "%"
	exactPattern := query + "%"

	rows, err := db.DBService.DB.Query(searchQuery, searchPattern, searchPattern, currentUserID, currentUserID, exactPattern, exactPattern, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var post models.PostResponse
		var avatar sql.NullString
		var authorFirstName, authorLastName sql.NullString
		var updatedAt sql.NullString
		var visibility string

		err := rows.Scan(
			&post.ID,
			&post.Title,
			&post.Body,
			&post.AuthorID,
			&post.CreatedAt,
			&updatedAt,
			&post.AuthorNickname,
			&authorFirstName,
			&authorLastName,
			&avatar,
			&visibility,
		)
		if err != nil {
			return nil, err
		}

		// Set PostType
		post.PostType = "user_post"

		// Set empty images array (images are stored in separate table)
		post.Images = []string{}

		// Handle avatar
		if avatar.Valid {
			post.AuthorAvatar = avatar
		} else {
			post.AuthorAvatar = sql.NullString{String: "", Valid: false}
		}

		// Handle updatedAt
		if updatedAt.Valid {
			post.UpdatedAt = updatedAt
		} else {
			post.UpdatedAt = sql.NullString{String: "", Valid: false}
		}

		// Set default values for missing fields
		post.Likes = 0
		post.Dislikes = 0
		post.UserLiked = false
		post.UserDisliked = false

		posts = append(posts, post)
	}

	return posts, nil
}
