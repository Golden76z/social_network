package demo

import (
	"database/sql"
	"encoding/csv"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"

	"golang.org/x/crypto/bcrypt"

	"github.com/Golden76z/social-network/db"
	"github.com/Golden76z/social-network/models"
)

func GenerateSeed() {
	lockFilePath := "demo/seed.lock"

	// Check if seed has already been run
	if _, err := os.Stat(lockFilePath); err == nil {
		log.Println("🔒 Seed already generated. Skipping seeding process.")
		return
	}

	log.Println("Seeding users...")
	if err := SeedFromCSV("demo/seed/users.csv", func(rows [][]string) error {
		return SeedUsers(db.DBService, rows)
	}); err != nil {
		log.Fatalf("user seeding failed: %v", err)
	}

	log.Println("Seeding follow requests...")
	if err := SeedFromCSV("demo/seed/follows.csv", func(rows [][]string) error {
		return SeedFollows(db.DBService, rows)
	}); err != nil {
		log.Fatalf("follow seeding failed: %v", err)
	}

	log.Println("Seeding posts...")
	if err := seedPosts(db.DBService); err != nil {
		log.Fatal("Failed to seed posts:", err)
	}

	log.Println("Seeding group creation...")
	if err := SeedFromCSV("demo/seed/group.csv", func(rows [][]string) error {
		return SeedGroupsFromCSV(db.DBService, rows)
	}); err != nil {
		log.Fatalf("group seeding failed: %v", err)
	}

	log.Println("Seeding group members...")
	if err := SeedFromCSV("demo/seed/group_members.csv", func(rows [][]string) error {
		return SeedGroupMembers(db.DBService, rows)
	}); err != nil {
		log.Fatalf("group members seeding failed: %v", err)
	}

	log.Println("Seeding group posts...")
	if err := seedGroupPosts(db.DBService); err != nil {
		log.Fatal("Failed to seed group posts:", err)
	}

	log.Println("Seeding comments...")
	if err := seedComments(db.DBService); err != nil {
		log.Fatal("Failed to seed comments:", err)
	}

	log.Println("Seeding group comments...")
	if err := seedGroupComments(db.DBService); err != nil {
		log.Fatal("Failed to seed group comments:", err)
	}

	log.Println("Seeding post images...")
	if err := seedPostImages(db.DBService); err != nil {
		log.Fatal("Failed to seed post images:", err)
	}

	log.Println("Seeding likes and dislikes...")
	if err := SeedFromCSV("demo/seed/likes_dislikes.csv", func(rows [][]string) error {
		return SeedLikesDislikes(db.DBService, rows)
	}); err != nil {
		log.Fatalf("likes/dislikes seeding failed: %v", err)
	}

	log.Println("Seeding group messages...")
	if err := SeedFromCSV("demo/seed/group_messages.csv", func(rows [][]string) error {
		return SeedGroupMessages(db.DBService, rows)
	}); err != nil {
		log.Fatalf("group messages seeding failed: %v", err)
	}

	log.Println("Seeding private messages...")
	if err := SeedFromCSV("demo/seed/private_messages.csv", func(rows [][]string) error {
		return SeedPrivateMessages(db.DBService, rows)
	}); err != nil {
		log.Fatalf("private messages seeding failed: %v", err)
	}

	log.Println("Seeding group events...")
	if err := SeedFromCSV("demo/seed/group_events.csv", func(rows [][]string) error {
		return SeedGroupEvents(db.DBService, rows)
	}); err != nil {
		log.Fatalf("group events seeding failed: %v", err)
	}

	log.Println("Seeding event RSVPs...")
	if err := SeedFromCSV("demo/seed/event_rsvps.csv", func(rows [][]string) error {
		return SeedEventRSVPs(db.DBService, rows)
	}); err != nil {
		log.Fatalf("event RSVPs seeding failed: %v", err)
	}

	if err := os.WriteFile(lockFilePath, []byte("seeded"), 0644); err != nil {
		log.Printf("⚠️ Failed to write seed lock file: %v", err)
	}

	log.Println("Seeding complete.")
	fmt.Println("✅ All seed data inserted successfully.")
}

func SeedFromCSV(path string, callback func([][]string) error) error {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer f.Close()

	reader := csv.NewReader(f)
	records, err := reader.ReadAll()
	if err != nil {
		return err
	}

	return callback(records)
}

func SeedUsers(s *db.Service, rows [][]string) error {
	for i, row := range rows {
		if i == 0 {
			continue // skip header
		}
		if len(row) < 9 {
			log.Printf("Skipping malformed row %d: %v", i, row)
			continue // skip header or malformed rows
		}

		// Hash password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(row[4]), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("failed to hash password for %s: %v", row[0], err)
			continue
		}

		user := models.User{
			Nickname:    row[0],
			FirstName:   row[1],
			LastName:    row[2],
			Email:       row[3],
			Password:    string(hashedPassword),
			DateOfBirth: row[5],
			Avatar: sql.NullString{
				String: row[6],
				Valid:  row[6] != "",
			},
			Bio: sql.NullString{
				String: row[7],
				Valid:  row[7] != "",
			},
		}

		// Parse is_private
		isPrivate, err := strconv.ParseBool(row[8])
		if err != nil {
			log.Printf("invalid is_private value for %s: %v", row[0], err)
		}
		user.IsPrivate = isPrivate

		if err := s.CreateUser(user); err != nil {
			log.Printf("failed to create user %s: %v", user.Nickname, err)
		}
	}
	return nil
}

func SeedFollows(s *db.Service, rows [][]string) error {
	for i, row := range rows {
		if i == 0 {
			continue // skip header
		}
		if len(row) < 3 {
			log.Printf("Skipping malformed follow row %d: %v", i, row)
			continue
		}

		requesterNick := row[0]
		targetNick := row[1]
		status := row[2]

		requesterID, err := s.GetUserIDByUsername(requesterNick)
		if err != nil {
			log.Printf("could not find requester '%s': %v", requesterNick, err)
			continue
		}
		targetID, err := s.GetUserIDByUsername(targetNick)
		if err != nil {
			log.Printf("could not find target '%s': %v", targetNick, err)
			continue
		}

		if err := s.CreateFollowRequest(requesterID, targetID, status); err != nil {
			log.Printf("failed to create follow request %s -> %s: %v", requesterNick, targetNick, err)
		}
	}
	return nil
}

func SeedGroupMembers(s *db.Service, rows [][]string) error {
	for i, row := range rows {
		if i == 0 {
			continue // skip header
		}
		if len(row) < 5 {
			log.Printf("Skipping malformed group member row %d: %v", i, row)
			continue
		}

		groupID, err := strconv.ParseInt(row[0], 10, 64)
		if err != nil {
			log.Printf("invalid group_id at row %d: %v", i, err)
			continue
		}

		userID, err := strconv.ParseInt(row[1], 10, 64)
		if err != nil {
			log.Printf("invalid user_id at row %d: %v", i, err)
			continue
		}

		role := row[2]
		status := row[3]

		var invitedBy *int64
		if row[4] != "" {
			invitedByValue, err := strconv.ParseInt(row[4], 10, 64)
			if err != nil {
				log.Printf("invalid invited_by at row %d: %v", i, err)
				continue
			}
			invitedBy = &invitedByValue
		}

		if err := s.CreateGroupMember(groupID, userID, role, status, invitedBy); err != nil {
			log.Printf("failed to create group member (group: %d, user: %d): %v", groupID, userID, err)
		}
	}
	return nil
}

func seedPosts(s *db.Service) error {
	path := filepath.Join("demo", "seed", "posts.csv")
	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer file.Close()

	r := csv.NewReader(file)
	records, _ := r.ReadAll()
	for i, row := range records {
		if i == 0 {
			continue // skip header
		}
		userID, _ := strconv.ParseInt(row[1], 10, 64)
		post := models.CreatePostRequest{
			Title:      row[2],
			Body:       row[3],
			Visibility: row[4],
		}
		if err := s.CreatePost(userID, post); err != nil {
			log.Printf("Error creating post (line %d): %v", i+1, err)
		}
	}
	return nil
}

func seedGroupPosts(s *db.Service) error {
	path := filepath.Join("demo", "seed", "group_posts.csv")
	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer file.Close()

	r := csv.NewReader(file)
	records, _ := r.ReadAll()
	for i, row := range records {
		if i == 0 {
			continue
		}
		groupID, _ := strconv.Atoi(row[1])
		userID, _ := strconv.ParseInt(row[2], 10, 64)
		req := models.CreateGroupPostRequest{
			GroupID: int64(groupID),
			Title:   row[3],
			Body:    row[4],
		}
		if err := s.CreateGroupPost(req, userID); err != nil {
			log.Printf("Error creating group post (line %d): %v", i+1, err)
		}
	}
	return nil
}

func seedComments(s *db.Service) error {
	path := filepath.Join("demo", "seed", "comments.csv")
	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer file.Close()

	r := csv.NewReader(file)
	records, err := r.ReadAll()
	if err != nil {
		return err
	}

	for i, row := range records {
		if i == 0 {
			continue // skip header
		}
		if len(row) < 3 {
			log.Printf("Skipping malformed comment row %d: %v", i, row)
			continue
		}

		postID, err := strconv.ParseInt(row[0], 10, 64)
		if err != nil {
			log.Printf("invalid post_id at row %d: %v", i, err)
			continue
		}

		userID, err := strconv.ParseInt(row[1], 10, 64)
		if err != nil {
			log.Printf("invalid user_id at row %d: %v", i, err)
			continue
		}

		comment := models.CreateCommentRequest{
			PostID: postID,
			UserID: userID,
			Body:   row[2],
		}

		if err := s.CreateComment(comment); err != nil {
			log.Printf("Error creating comment (line %d): %v", i+1, err)
		}
	}
	return nil
}

func seedGroupComments(s *db.Service) error {
	path := filepath.Join("demo", "seed", "group_comments.csv")
	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer file.Close()

	r := csv.NewReader(file)
	records, err := r.ReadAll()
	if err != nil {
		return err
	}

	for i, row := range records {
		if i == 0 {
			continue // skip header
		}
		if len(row) < 3 {
			log.Printf("Skipping malformed group comment row %d: %v", i, row)
			continue
		}

		groupPostID, err := strconv.ParseInt(row[0], 10, 64)
		if err != nil {
			log.Printf("invalid group_post_id at row %d: %v", i, err)
			continue
		}

		userID, err := strconv.ParseInt(row[1], 10, 64)
		if err != nil {
			log.Printf("invalid user_id at row %d: %v", i, err)
			continue
		}

		body := row[2]

		comment := models.CreateGroupCommentRequest{
			GroupPostID: groupPostID,
			Body:        body,
		}

		if err := s.CreateGroupComment(comment, userID); err != nil {
			log.Printf("Error creating group comment (line %d): %v", i+1, err)
		}
	}
	return nil
}

func seedPostImages(s *db.Service) error {
	path := filepath.Join("demo", "seed", "post_images.csv")
	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer file.Close()

	r := csv.NewReader(file)
	records, _ := r.ReadAll()
	for i, row := range records {
		if i == 0 {
			continue
		}
		postID, _ := strconv.Atoi(row[0])
		isGroupPost := row[1] == "1"
		imageURL := row[2]

		if err := s.InsertPostImage(postID, isGroupPost, imageURL); err != nil {
			log.Printf("Error inserting image (line %d): %v", i+1, err)
		}
	}
	return nil
}

func SeedGroupsFromCSV(s *db.Service, rows [][]string) error {
	for i, row := range rows {
		if i == 0 {
			continue // skip header
		}
		if len(row) < 5 {
			log.Printf("Skipping malformed group row %d: %v", i, row)
			continue
		}

		creatorID, err := strconv.ParseInt(row[4], 10, 64)
		if err != nil {
			log.Printf("invalid creator_id for group %s: %v", row[1], err)
			continue
		}

		group := models.CreateGroupRequest{
			Title:  row[1],
			Avatar: row[2],
			Bio:    row[3],
		}

		if err := s.CreateGroup(group, creatorID); err != nil {
			log.Printf("failed to create group %s: %v", group.Title, err)
		}
	}
	return nil
}

func SeedLikesDislikes(s *db.Service, rows [][]string) error {
	for i, row := range rows {
		if i == 0 {
			continue // skip header
		}
		if len(row) < 6 {
			log.Printf("Skipping malformed like/dislike row %d: %v", i, row)
			continue
		}

		userID, err := strconv.ParseInt(row[0], 10, 64)
		if err != nil {
			log.Printf("invalid user_id at row %d: %v", i, err)
			continue
		}

		var postID, commentID, groupPostID, groupCommentID *int64

		if row[1] != "" {
			id, err := strconv.ParseInt(row[1], 10, 64)
			if err == nil {
				postID = &id
			}
		}
		if row[2] != "" {
			id, err := strconv.ParseInt(row[2], 10, 64)
			if err == nil {
				commentID = &id
			}
		}
		if row[3] != "" {
			id, err := strconv.ParseInt(row[3], 10, 64)
			if err == nil {
				groupPostID = &id
			}
		}
		if row[4] != "" {
			id, err := strconv.ParseInt(row[4], 10, 64)
			if err == nil {
				groupCommentID = &id
			}
		}

		reactionType := row[5]

		reaction := models.CreateReactionRequest{
			UserID:         userID,
			PostID:         postID,
			CommentID:      commentID,
			GroupPostID:    groupPostID,
			GroupCommentID: groupCommentID,
			Type:           reactionType,
		}

		if err := s.CreateLikeDislike(reaction); err != nil {
			log.Printf("failed to create like/dislike at row %d: %v", i, err)
		}
	}
	return nil
}

func SeedGroupMessages(s *db.Service, rows [][]string) error {
	for i, row := range rows {
		if i == 0 {
			continue // skip header
		}
		if len(row) < 4 {
			log.Printf("Skipping malformed group message row %d: %v", i, row)
			continue
		}

		groupID, err := strconv.ParseInt(row[0], 10, 64)
		if err != nil {
			log.Printf("invalid group_id at row %d: %v", i, err)
			continue
		}

		senderID, err := strconv.ParseInt(row[1], 10, 64)
		if err != nil {
			log.Printf("invalid sender_id at row %d: %v", i, err)
			continue
		}

		body := row[2]

		if err := s.CreateGroupMessage(groupID, senderID, body); err != nil {
			log.Printf("failed to create group message at row %d: %v", i, err)
		}
	}
	return nil
}

func SeedPrivateMessages(s *db.Service, rows [][]string) error {
	for i, row := range rows {
		if i == 0 {
			continue // skip header
		}
		if len(row) < 4 {
			log.Printf("Skipping malformed private message row %d: %v", i, row)
			continue
		}

		senderID, err := strconv.ParseInt(row[0], 10, 64)
		if err != nil {
			log.Printf("invalid sender_id at row %d: %v", i, err)
			continue
		}

		receiverID, err := strconv.ParseInt(row[1], 10, 64)
		if err != nil {
			log.Printf("invalid receiver_id at row %d: %v", i, err)
			continue
		}

		content := row[2]
		// createdAt := row[3]

		if err := s.CreatePrivateMessage(
			senderID, receiverID, content,
		); err != nil {
			log.Printf("failed to create private message at row %d: %v", i, err)
		}
	}
	return nil
}

func SeedGroupEvents(s *db.Service, rows [][]string) error {
	for i, row := range rows {
		if i == 0 {
			continue // skip header
		}
		if len(row) < 5 {
			log.Printf("Skipping malformed group event row %d: %v", i, row)
			continue
		}

		groupID, err := strconv.ParseInt(row[0], 10, 64)
		if err != nil {
			log.Printf("invalid group_id at row %d: %v", i, err)
			continue
		}

		creatorID, err := strconv.ParseInt(row[1], 10, 64)
		if err != nil {
			log.Printf("invalid creator_id at row %d: %v", i, err)
			continue
		}

		event := models.CreateGroupEventRequest{
			GroupID:       groupID,
			Title:         row[2],
			Description:   row[3],
			EventDateTime: row[4],
		}

		if err := s.CreateGroupEvent(event, creatorID); err != nil {
			log.Printf("failed to create group event at row %d: %v", i, err)
		}
	}
	return nil
}

func SeedEventRSVPs(s *db.Service, rows [][]string) error {
	for i, row := range rows {
		if i == 0 {
			continue // skip header
		}
		if len(row) < 4 {
			log.Printf("Skipping malformed event RSVP row %d: %v", i, row)
			continue
		}

		eventID, err := strconv.ParseInt(row[0], 10, 64)
		if err != nil {
			log.Printf("invalid event_id at row %d: %v", i, err)
			continue
		}

		userID, err := strconv.ParseInt(row[1], 10, 64)
		if err != nil {
			log.Printf("invalid user_id at row %d: %v", i, err)
			continue
		}

		rsvp := models.RSVPToEventRequest{
			EventID: eventID,
			UserID:  userID,
			Status:  row[2],
		}

		if err := s.CreateEventRSVP(rsvp); err != nil {
			log.Printf("failed to create event RSVP at row %d: %v", i, err)
		}
	}
	return nil
}
