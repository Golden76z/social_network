package db

import (
	"database/sql"
	"testing"

	"github.com/Golden76z/social-network/models"
	_ "github.com/mattn/go-sqlite3"
)

func setupTestDB(t *testing.T) *sql.DB {
	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatalf("failed to open db: %v", err)
	}

	_, err = db.Exec(`
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nickname VARCHAR(30) UNIQUE NOT NULL,
            first_name VARCHAR(50) NOT NULL,
            last_name VARCHAR(50) NOT NULL,
            email VARCHAR(70) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            date_of_birth DATE NOT NULL,
            avatar VARCHAR(255),
            bio TEXT,
            is_private BOOLEAN DEFAULT FALSE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            followers INT DEFAULT 0,
            followed INT DEFAULT 0
        );
		CREATE TABLE sessions (
			token TEXT PRIMARY KEY,
			user_id INTEGER NOT NULL,
			expires_at DATETIME NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		);

		CREATE INDEX idx_sessions_token ON sessions(token);
		CREATE INDEX idx_sessions_expires ON sessions(expires_at);
		
        CREATE TABLE posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title VARCHAR(255),
            body TEXT,
            image VARCHAR(255),
            visibility VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE post_visibility (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL
        );
        CREATE TABLE notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type VARCHAR(32) NOT NULL,
            data TEXT,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE likes_dislikes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            post_id INTEGER,
            comment_id INTEGER,
            group_post_id INTEGER,
            group_comment_id INTEGER,
            type VARCHAR(7) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title VARCHAR(30) NOT NULL,
            avatar VARCHAR(255),
            bio TEXT,
            creator_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE group_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            role VARCHAR(6) NOT NULL,
            status VARCHAR(8) NOT NULL,
            invited_by INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE group_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            title VARCHAR(255),
            body TEXT,
            image VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE group_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            status VARCHAR(8) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE group_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_id INTEGER NOT NULL,
            sender_id INTEGER NOT NULL,
            body TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE private_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            body TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE follow_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            requester_id INTEGER NOT NULL,
            target_id INTEGER NOT NULL,
            status VARCHAR(8) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE event_rsvps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            status VARCHAR(14) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE group_comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_post_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            body TEXT,
            image VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `)
	if err != nil {
		t.Fatalf("failed to create tables: %v", err)
	}
	return db
}

// Helper function to create a test user
func createTestUser(t *testing.T, nickname, firstName, lastName, email string) *models.User {
	userReq := models.User{
		Nickname:    nickname,
		FirstName:   firstName,
		LastName:    lastName,
		Email:       email,
		Password:    "pass",
		DateOfBirth: "2000-01-01",
		// Avatar:      "",
		// Bio:         "",
		IsPrivate: false,
	}

	err := DBService.CreateUser(userReq)
	if err != nil {
		t.Fatalf("CreateUser failed: %v", err)
	}

	user, err := DBService.GetUserByEmail(email)
	if err != nil {
		t.Fatalf("GetUserByEmail failed: %v", err)
	}
	return user
}

func TestUserCRUD(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	// Create user with request struct
	userReq := models.User{
		Nickname:    "nick",
		FirstName:   "John",
		LastName:    "Doe",
		Email:       "john@doe.com",
		Password:    "pass",
		DateOfBirth: "2000-01-01",
		// Avatar:      "",
		// Bio:         "",
		IsPrivate: false,
	}

	err := DBService.CreateUser(userReq)
	if err != nil {
		t.Fatalf("CreateUser failed: %v", err)
	}

	user, err := DBService.GetUserByEmail("john@doe.com")
	if err != nil || user.Nickname != "nick" {
		t.Fatalf("GetUserByEmail failed: %v", err)
	}

	// Update user with request struct
	newBio := "New bio"
	updateReq := models.UpdateUserProfileRequest{
		Bio: &newBio,
	}
	err = DBService.UpdateUser(user.ID, updateReq)
	if err != nil {
		t.Fatalf("UpdateUser failed: %v", err)
	}

	err = DBService.DeleteUser(user.ID)
	if err != nil {
		t.Fatalf("DeleteUser failed: %v", err)
	}
}

func TestPostCRUD(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	user := createTestUser(t, "nick", "John", "Doe", "john@doe.com")

	postReq := models.CreatePostRequest{
		Title:      "Title",
		Body:       "Body",
		Visibility: "public",
	}

	_,err := DBService.CreatePost(user.ID, postReq)
	if err != nil {
		t.Fatalf("CreatePost failed: %v", err)
	}

	post, err := DBService.GetPostByID(1, user.ID)
	if err != nil || post.Title != "Title" {
		t.Fatalf("GetPostByID failed: %v", err)
	}

	newTitle := "New Title"
	newBody := "New Body"
	newVisibility := "private"
	updateReq := models.UpdatePostRequest{
		Title:      &newTitle,
		Body:       &newBody,
		Visibility: &newVisibility,
	}

	err = DBService.UpdatePost(post.ID, updateReq)
	if err != nil {
		t.Fatalf("UpdatePost failed: %v", err)
	}

	err = DBService.DeletePost(post.ID)
	if err != nil {
		t.Fatalf("DeletePost failed: %v", err)
	}
}

func TestPostVisibilityCRUD(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	user := createTestUser(t, "nick", "John", "Doe", "john@doe.com")

	postReq := models.CreatePostRequest{
		Title:      "Title",
		Body:       "Body",
		Visibility: "public",
	}
	_,_ = DBService.CreatePost(user.ID, postReq)

	err := DBService.CreatePostVisibility(1, user.ID)
	if err != nil {
		t.Fatalf("CreatePostVisibility failed: %v", err)
	}

	pv, err := DBService.GetPostVisibilityByID(1)
	if err != nil || pv.PostID != 1 {
		t.Fatalf("GetPostVisibilityByID failed: %v", err)
	}

	err = DBService.DeletePostVisibility(pv.ID)
	if err != nil {
		t.Fatalf("DeletePostVisibility failed: %v", err)
	}
}

func TestNotificationCRUD(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	user := createTestUser(t, "nick", "John", "Doe", "john@doe.com")

	notifReq := models.CreateNotificationRequest{
		UserID:  user.ID,
		Type:    "test",
		NotifID: 1,
		Data:    "data",
	}

	err := DBService.CreateNotification(notifReq)
	if err != nil {
		t.Fatalf("CreateNotification failed: %v", err)
	}

	n, err := DBService.GetNotificationByID(1)
	if err != nil || n.Type != "test" {
		t.Fatalf("GetNotificationByID failed: %v", err)
	}

	err = DBService.MarkNotificationRead(n.ID)
	if err != nil {
		t.Fatalf("MarkNotificationRead failed: %v", err)
	}

	err = DBService.DeleteNotification(n.ID)
	if err != nil {
		t.Fatalf("DeleteNotification failed: %v", err)
	}
}

func TestLikeDislikeCRUD(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	user := createTestUser(t, "nick", "John", "Doe", "john@doe.com")

	postReq := models.CreatePostRequest{
		Title:      "Title",
		Body:       "Body",
		Visibility: "public",
	}
	_,_ = DBService.CreatePost(user.ID, postReq)

	postID := int64(1)
	reactionReq := models.CreateReactionRequest{
		UserID: user.ID,
		PostID: &postID,
		Type:   "like",
	}

	err := DBService.CreateLikeDislike(reactionReq)
	if err != nil {
		t.Fatalf("CreateLikeDislike failed: %v", err)
	}

	ld, err := DBService.GetLikeDislikeByID(1)
	if err != nil || *ld.PostID != 1 {
		t.Fatalf("GetLikeDislikeByID failed: %v", err)
	}

	err = DBService.DeleteLikeDislike(ld.ID)
	if err != nil {
		t.Fatalf("DeleteLikeDislike failed: %v", err)
	}
}

func TestGroupCRUD(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	user := createTestUser(t, "nick", "John", "Doe", "john@doe.com")

	groupReq := models.CreateGroupRequest{
		Title:  "GroupTitle",
		Avatar: "avatar.png",
		Bio:    "bio",
	}

	err := DBService.CreateGroup(groupReq, user.ID)
	if err != nil {
		t.Fatalf("CreateGroup failed: %v", err)
	}

	group, err := DBService.GetGroupByID(1)
	if err != nil || group.Title != "GroupTitle" {
		t.Fatalf("GetGroupByID failed: %v", err)
	}

	newTitle := "NewTitle"
	newAvatar := "newavatar.png"
	newBio := "newbio"
	updateReq := models.UpdateGroupRequest{
		Title:  &newTitle,
		Avatar: &newAvatar,
		Bio:    &newBio,
	}

	err = DBService.UpdateGroup(group.ID, updateReq)
	if err != nil {
		t.Fatalf("UpdateGroup failed: %v", err)
	}

	err = DBService.DeleteGroup(group.ID)
	if err != nil {
		t.Fatalf("DeleteGroup failed: %v", err)
	}
}

func TestGroupMemberCRUD(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	user := createTestUser(t, "nick", "John", "Doe", "john@doe.com")
	groupReq := models.CreateGroupRequest{
		Title:  "GroupTitle",
		Avatar: "avatar.png",
		Bio:    "bio",
	}
	_ = DBService.CreateGroup(groupReq, user.ID)

	err := DBService.CreateGroupMember(1, user.ID, "member", "pending", nil)
	if err != nil {
		t.Fatalf("CreateGroupMember failed: %v", err)
	}

	gm, err := DBService.GetGroupMemberByID(1)
	if err != nil || gm.UserID != user.ID {
		t.Fatalf("GetGroupMemberByID failed: %v", err)
	}

	err = DBService.UpdateGroupMemberStatus(gm.ID, "accepted")
	if err != nil {
		t.Fatalf("UpdateGroupMemberStatus failed: %v", err)
	}

	err = DBService.DeleteGroupMember(gm.ID)
	if err != nil {
		t.Fatalf("DeleteGroupMember failed: %v", err)
	}
}

func TestGroupPostCRUD(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	user := createTestUser(t, "nick", "John", "Doe", "john@doe.com")
	groupReq := models.CreateGroupRequest{
		Title:  "GroupTitle",
		Avatar: "avatar.png",
		Bio:    "bio",
	}
	_ = DBService.CreateGroup(groupReq, user.ID)

	postReq := models.CreateGroupPostRequest{
		GroupID: 1,
		Title:   "Title",
		Body:    "Body",
	}

	err := DBService.CreateGroupPost(postReq, user.ID)
	if err != nil {
		t.Fatalf("CreateGroupPost failed: %v", err)
	}

	gp, err := DBService.GetGroupPostWithImagesByID(1, user.ID)
	if err != nil || gp.Title != "Title" {
		t.Fatalf("GetGroupPostByID failed: %v", err)
	}

	newTitle := "NewTitle"
	newBody := "NewBody"
	updateReq := models.UpdateGroupPostRequest{
		Title: &newTitle,
		Body:  &newBody,
	}

	err = DBService.UpdateGroupPost(updateReq, gp.UserID)
	if err != nil {
		t.Fatalf("UpdateGroupPost failed: %v", err)
	}

	err = DBService.DeleteGroupPost(gp.ID, gp.UserID)
	if err != nil {
		t.Fatalf("DeleteGroupPost failed: %v", err)
	}
}

func TestGroupRequestCRUD(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	user := createTestUser(t, "nick", "John", "Doe", "john@doe.com")
	groupReq := models.CreateGroupRequest{
		Title:  "GroupTitle",
		Avatar: "avatar.png",
		Bio:    "bio",
	}
	_ = DBService.CreateGroup(groupReq, user.ID)

	err := DBService.CreateGroupRequest(1, user.ID, "pending")
	if err != nil {
		t.Fatalf("CreateGroupRequest failed: %v", err)
	}

	gr, err := DBService.GetGroupRequestByID(1)
	if err != nil || gr.UserID != user.ID {
		t.Fatalf("GetGroupRequestByID failed: %v", err)
	}

	err = DBService.UpdateGroupRequestStatus(gr.ID, "accepted")
	if err != nil {
		t.Fatalf("UpdateGroupRequestStatus failed: %v", err)
	}

	err = DBService.DeleteGroupRequest(gr.ID)
	if err != nil {
		t.Fatalf("DeleteGroupRequest failed: %v", err)
	}
}

func TestGroupMessageCRUD(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	user := createTestUser(t, "nick", "John", "Doe", "john@doe.com")
	groupReq := models.CreateGroupRequest{
		Title:  "GroupTitle",
		Avatar: "avatar.png",
		Bio:    "bio",
	}
	_ = DBService.CreateGroup(groupReq, user.ID)

	err := DBService.CreateGroupMessage(1, user.ID, "Hello group!")
	if err != nil {
		t.Fatalf("CreateGroupMessage failed: %v", err)
	}

	gm, err := DBService.GetGroupMessageByID(1)
	if err != nil || gm.Body != "Hello group!" {
		t.Fatalf("GetGroupMessageByID failed: %v", err)
	}

	err = DeleteGroupMessage(db, gm.ID)
	if err != nil {
		t.Fatalf("DeleteGroupMessage failed: %v", err)
	}
}

func TestPrivateMessageCRUD(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	sender := createTestUser(t, "nick", "John", "Doe", "john@doe.com")
	receiver := createTestUser(t, "nick2", "Jane", "Smith", "jane@smith.com")

	err := DBService.CreatePrivateMessage(sender.ID, receiver.ID, "Hello Jane!")
	if err != nil {
		t.Fatalf("CreatePrivateMessage failed: %v", err)
	}

	pm, err := DBService.GetPrivateMessageByID(1)
	if err != nil || pm.Body != "Hello Jane!" {
		t.Fatalf("GetPrivateMessageByID failed: %v", err)
	}

	err = DBService.DeletePrivateMessage(pm.ID)
	if err != nil {
		t.Fatalf("DeletePrivateMessage failed: %v", err)
	}
}

func TestFollowRequestCRUD(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	requester := createTestUser(t, "nick", "John", "Doe", "john@doe.com")
	target := createTestUser(t, "nick2", "Jane", "Smith", "jane@smith.com")

	err := DBService.CreateFollowRequest(requester.ID, target.ID, "pending")
	if err != nil {
		t.Fatalf("CreateFollowRequest failed: %v", err)
	}

	fr, err := DBService.GetFollowRequestByID(1)
	if err != nil || fr.RequesterID != requester.ID {
		t.Fatalf("GetFollowRequestByID failed: %v", err)
	}

	err = DBService.UpdateFollowRequestStatus(fr.ID, "accepted")
	if err != nil {
		t.Fatalf("UpdateFollowRequestStatus failed: %v", err)
	}

	err = DBService.DeleteFollowRequest(fr.ID)
	if err != nil {
		t.Fatalf("DeleteFollowRequest failed: %v", err)
	}
}

func TestEventRSVPCRUD(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	// Minimal event_id for test
	_, err := db.Exec(`CREATE TABLE group_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        creator_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_datetime TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`)
	if err != nil {
		t.Fatalf("failed to create group_events table: %v", err)
	}
	_, err = db.Exec(`INSERT INTO group_events (group_id, creator_id, title, description, event_datetime) VALUES (1, 1, 'Event', 'Desc', '2025-01-01 10:00:00')`)
	if err != nil {
		t.Fatalf("failed to insert group_event: %v", err)
	}

	user := createTestUser(t, "nick", "John", "Doe", "john@doe.com")

	rsvpReq := models.RSVPToEventRequest{
		EventID: 1,
		UserID:  user.ID,
		Status:  "come",
	}

	err = DBService.CreateEventRSVP(rsvpReq)
	if err != nil {
		t.Fatalf("CreateEventRSVP failed: %v", err)
	}

	rsvp, err := DBService.GetEventRSVPByID(1)
	if err != nil || rsvp.UserID != user.ID {
		t.Fatalf("GetEventRSVPByID failed: %v", err)
	}

	err = DBService.UpdateEventRSVPStatus(rsvp.ID, "not_come")
	if err != nil {
		t.Fatalf("UpdateEventRSVPStatus failed: %v", err)
	}

	err = DBService.DeleteEventRSVP(rsvp.ID)
	if err != nil {
		t.Fatalf("DeleteEventRSVP failed: %v", err)
	}
}

func TestGroupCommentCRUD(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	user := createTestUser(t, "nick", "John", "Doe", "john@doe.com")
	groupReq := models.CreateGroupRequest{
		Title:  "GroupTitle",
		Avatar: "avatar.png",
		Bio:    "bio",
	}
	_ = DBService.CreateGroup(groupReq, user.ID)

	postReq := models.CreateGroupPostRequest{
		GroupID: 1,
		Title:   "Title",
		Body:    "Body",
	}
	_ = DBService.CreateGroupPost(postReq, user.ID)

	commentReq := models.CreateGroupCommentRequest{
		GroupPostID: 1,
		Body:        "Comment body",
	}

	err := DBService.CreateGroupComment(commentReq, user.ID)
	if err != nil {
		t.Fatalf("CreateGroupComment failed: %v", err)
	}

	gc, err := DBService.GetGroupCommentByID(1, user.ID)
	if err != nil || gc.Body != "Comment body" {
		t.Fatalf("GetGroupCommentByID failed: %v", err)
	}

	newBody := "Updated comment"
	updateReq := models.UpdateGroupCommentRequest{
		Body: &newBody,
	}

	err = DBService.UpdateGroupComment(gc.ID, gc.UserID, updateReq)
	if err != nil {
		t.Fatalf("UpdateGroupComment failed: %v", err)
	}

	err = DBService.DeleteGroupComment(gc.ID, gc.UserID)
	if err != nil {
		t.Fatalf("DeleteGroupComment failed: %v", err)
	}
}
