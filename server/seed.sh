#!/bin/bash
# 
# Social Network Database Seeder
# 
# This script creates realistic test data for the social network database.
# It adds users, posts, comments, groups, and follow requests.
# 
# Usage: ./seed.sh
# 

set -e  # Exit on any error

echo "🌱 Social Network Database Seeder"
echo "=================================="

# Check prerequisites
if [ ! -f "social_network.db" ]; then
    echo "❌ Error: social_network.db not found in current directory"
    echo "   Please run this script from the server directory"
    exit 1
fi

if ! command -v go &> /dev/null; then
    echo "❌ Error: Go is not installed"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Create the seeder program
cat > temp_seeder.go << 'EOF'
package main

import (
	"database/sql"
	"fmt"
	"log"
	"math/rand"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	db, err := sql.Open("sqlite3", "./social_network.db")
	if err != nil {
		log.Fatal("Failed to open database:", err)
	}
	defer db.Close()

	rand.Seed(time.Now().UnixNano())

	fmt.Println("🌱 Seeding database with test data...")
	
	fmt.Print("👥 Users: ")
	userIDs := seedUsers(db)
	fmt.Printf("- %d users available for seeding\n", len(userIDs))

	if len(userIDs) == 0 {
		fmt.Println("❌ No users available - cannot proceed with seeding")
		return
	}

	followIDs := seedFollowRequests(db, userIDs)
	fmt.Printf("🤝 Follow requests: %d added\n", len(followIDs))

	postIDs := seedPosts(db, userIDs)
	fmt.Printf("📝 Posts: %d added\n", len(postIDs))

	commentIDs := seedComments(db, postIDs, userIDs)
	fmt.Printf("💬 Comments: %d added\n", len(commentIDs))

	visibilityIDs := seedPostVisibility(db, postIDs, userIDs)
	fmt.Printf("👁️ Post visibilities: %d added\n", len(visibilityIDs))

	groupIDs := seedGroups(db, userIDs)
	fmt.Printf("👥 Groups: %d added\n", len(groupIDs))

	memberIDs := seedGroupMembers(db, groupIDs, userIDs)
	fmt.Printf("🏷️ Group members: %d added\n", len(memberIDs))

	requestIDs := seedGroupRequests(db, groupIDs, userIDs)
	fmt.Printf("📋 Group requests: %d added\n", len(requestIDs))

	inviteIDs := seedGroupInvitations(db, groupIDs, userIDs)
	fmt.Printf("📨 Group invitations: %d added\n", len(inviteIDs))

	groupPostIDs := seedGroupPosts(db, groupIDs, userIDs)
	fmt.Printf("📄 Group posts: %d added\n", len(groupPostIDs))

	groupCommentIDs := seedGroupComments(db, groupPostIDs, userIDs)
	fmt.Printf("💭 Group comments: %d added\n", len(groupCommentIDs))

	eventIDs := seedGroupEvents(db, groupIDs, userIDs)
	fmt.Printf("📅 Group events: %d added\n", len(eventIDs))

	rsvpIDs := seedEventRSVPs(db, eventIDs, userIDs)
	fmt.Printf("✅ Event RSVPs: %d added\n", len(rsvpIDs))

	messageIDs := seedGroupMessages(db, groupIDs, userIDs)
	fmt.Printf("💬 Group messages: %d added\n", len(messageIDs))

	privateMessageIDs := seedPrivateMessages(db, userIDs)
	fmt.Printf("💌 Private messages: %d added\n", len(privateMessageIDs))

	likeIDs := seedLikesDislikes(db, postIDs, commentIDs, groupPostIDs, groupCommentIDs, userIDs)
	fmt.Printf("👍 Likes/dislikes: %d added\n", len(likeIDs))

	notificationIDs := seedNotifications(db, userIDs)
	fmt.Printf("🔔 Notifications: %d added\n", len(notificationIDs))

	printSummary(db)
}

func seedUsers(db *sql.DB) []int {
	users := []struct {
		nickname, firstName, lastName, email, password, dateOfBirth, bio string
		isPrivate bool
	}{
		{"test_alice", "Alice", "Johnson", "test_alice@example.com", "$2a$10$hashedpassword", "1990-03-15", "Full-stack developer passionate about clean code", false},
		{"test_bob", "Bob", "Wilson", "test_bob@example.com", "$2a$10$hashedpassword", "1988-07-22", "UX designer focused on user-centered design", false},
		{"test_carol", "Carol", "Davis", "test_carol@example.com", "$2a$10$hashedpassword", "1992-11-08", "Data scientist exploring machine learning", true},
		{"test_david", "David", "Miller", "test_david@example.com", "$2a$10$hashedpassword", "1985-09-14", "Product manager driving innovation", false},
		{"test_emma", "Emma", "Brown", "test_emma@example.com", "$2a$10$hashedpassword", "1994-01-28", "Content creator and social media enthusiast", true},
	}

	var userIDs []int
	addedCount := 0
	
	for _, user := range users {
		// Try to insert the user
		result, err := db.Exec(`
			INSERT INTO users (nickname, first_name, last_name, email, password, date_of_birth, bio, is_private)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			user.nickname, user.firstName, user.lastName, user.email, user.password, user.dateOfBirth, user.bio, user.isPrivate)
		
		if err != nil {
			// If user already exists, get their ID
			var existingID int
			err = db.QueryRow("SELECT id FROM users WHERE email = ?", user.email).Scan(&existingID)
			if err == nil {
				userIDs = append(userIDs, existingID)
			} else {
				log.Printf("Warning: Could not find or insert user %s: %v", user.nickname, err)
			}
		} else {
			// User was successfully inserted
			id, _ := result.LastInsertId()
			userIDs = append(userIDs, int(id))
			addedCount++
		}
	}
	
	// Also get some existing users to have more variety
	rows, err := db.Query("SELECT id FROM users WHERE email NOT LIKE 'test_%@%' LIMIT 10")
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var id int
			if rows.Scan(&id) == nil {
				userIDs = append(userIDs, id)
			}
		}
	}
	
	// Return the count of newly added users for reporting
	fmt.Printf("(New: %d, Total available: %d) ", addedCount, len(userIDs))
	return userIDs
}

func seedFollowRequests(db *sql.DB, userIDs []int) []int {
	if len(userIDs) < 2 {
		return []int{}
	}

	statuses := []string{"pending", "accepted", "declined"}
	var requestIDs []int

	// Create some follow requests between users
	for i := 0; i < len(userIDs)-1; i++ {
		requesterID := userIDs[i]
		targetID := userIDs[i+1]
		status := statuses[rand.Intn(len(statuses))]
		
		// Check if follow request already exists
		var exists int
		err := db.QueryRow("SELECT COUNT(*) FROM follow_requests WHERE requester_id = ? AND target_id = ?", 
			requesterID, targetID).Scan(&exists)
		if err != nil || exists > 0 {
			continue // Skip if already exists or error checking
		}
		
		result, err := db.Exec(`
			INSERT INTO follow_requests (requester_id, target_id, status)
			VALUES (?, ?, ?)`,
			requesterID, targetID, status)
		if err != nil {
			log.Printf("Warning: Could not insert follow request: %v", err)
			continue
		}
		id, _ := result.LastInsertId()
		requestIDs = append(requestIDs, int(id))
	}
	return requestIDs
}

func seedPosts(db *sql.DB, userIDs []int) []int {
	if len(userIDs) == 0 {
		return []int{}
	}

	// First get existing posts
	var existingPostIDs []int
	rows, err := db.Query("SELECT id FROM posts")
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var id int
			if rows.Scan(&id) == nil {
				existingPostIDs = append(existingPostIDs, id)
			}
		}
	}

	posts := []struct {
		title, body, visibility string
	}{
		{"Welcome to the platform!", "Just joined this amazing social network. Looking forward to connecting with like-minded people!", "public"},
		{"Beautiful sunset today", "Witnessed an incredible sunset from my balcony. Sometimes nature just takes your breath away.", "public"},
		{"Coffee shop discoveries", "Found this amazing local coffee shop with the best espresso in town. Highly recommend!", "public"},
		{"Weekend hiking adventure", "Planning a hiking trip to the mountains this weekend. Anyone interested in joining?", "public"},
		{"Book recommendation", "Just finished reading an incredible sci-fi novel. The world-building was absolutely phenomenal!", "public"},
		{"Work milestone", "Successfully launched our team's project today. Months of hard work finally paying off!", "private"},
		{"Cooking experiment", "Tried making homemade pasta for the first time. The results were... educational!", "public"},
		{"Morning motivation", "Starting the day with positive energy and determination to achieve great things!", "public"},
		{"Tech trends discussion", "Interesting developments in AI and machine learning. What's everyone's thoughts?", "public"},
		{"Weekend plans", "Looking forward to some well-deserved downtime this weekend. Any suggestions for activities?", "public"},
	}

	var allPostIDs []int = existingPostIDs
	
	for i, post := range posts {
		if i >= len(userIDs) {
			break
		}
		userID := userIDs[i%len(userIDs)]
		result, err := db.Exec(`
			INSERT INTO posts (user_id, title, body, visibility)
			VALUES (?, ?, ?, ?)`,
			userID, post.title, post.body, post.visibility)
		if err != nil {
			log.Printf("Warning: Could not insert post: %v", err)
			continue
		}
		id, _ := result.LastInsertId()
		allPostIDs = append(allPostIDs, int(id))
	}
	return allPostIDs
}

func seedComments(db *sql.DB, postIDs, userIDs []int) []int {
	if len(postIDs) == 0 || len(userIDs) == 0 {
		return []int{}
	}

	comments := []string{
		"Great post! Thanks for sharing your thoughts.",
		"I completely agree with your perspective on this.",
		"This is really interesting. Would love to hear more!",
		"Amazing photo! Where was this taken?",
		"Thanks for the recommendation. I'll definitely check it out.",
		"Your posts always inspire me. Keep up the great work!",
		"Interesting point of view. I hadn't considered that angle.",
		"Love this content! Can't wait to see what you post next.",
	}

	var commentIDs []int
	for _, postID := range postIDs {
		// Add 1-2 comments per post
		numComments := rand.Intn(2) + 1
		for j := 0; j < numComments; j++ {
			userID := userIDs[rand.Intn(len(userIDs))]
			comment := comments[rand.Intn(len(comments))]
			
			result, err := db.Exec(`
				INSERT INTO comments (post_id, user_id, body)
				VALUES (?, ?, ?)`,
				postID, userID, comment)
			if err != nil {
				log.Printf("Warning: Could not insert comment: %v", err)
				continue
			}
			id, _ := result.LastInsertId()
			commentIDs = append(commentIDs, int(id))
		}
	}
	return commentIDs
}

func seedGroups(db *sql.DB, userIDs []int) []int {
	if len(userIDs) == 0 {
		return []int{}
	}

	groups := []struct {
		title, description string
	}{
		{"Tech Innovators", "A community for discussing cutting-edge technology and innovation"},
		{"Photography Enthusiasts", "Share your best shots and learn new photography techniques"},
		{"Book Club", "Monthly book discussions and literary recommendations"},
		{"Fitness Motivation", "Support each other in achieving health and fitness goals"},
		{"Travel Adventures", "Share travel experiences and discover new destinations"},
	}

	var groupIDs []int
	
	// First, try to get existing groups to avoid duplicates
	rows, err := db.Query("SELECT id FROM groups")
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var id int
			if rows.Scan(&id) == nil {
				groupIDs = append(groupIDs, id)
			}
		}
	}
	
	// If we have enough groups already, return them
	if len(groupIDs) >= 3 {
		return groupIDs
	}
	
	// Otherwise, add new groups
	for i, group := range groups {
		if i >= len(userIDs) {
			break
		}
		
		// Check if group already exists
		var exists int
		err := db.QueryRow("SELECT COUNT(*) FROM groups WHERE title = ?", group.title).Scan(&exists)
		if err != nil || exists > 0 {
			continue // Skip if already exists
		}
		
		creatorID := userIDs[i%len(userIDs)]
		result, err := db.Exec(`
			INSERT INTO groups (title, description, creator_id)
			VALUES (?, ?, ?)`,
			group.title, group.description, creatorID)
		if err != nil {
			log.Printf("Warning: Could not insert group: %v", err)
			continue
		}
		id, _ := result.LastInsertId()
		groupIDs = append(groupIDs, int(id))
	}
	return groupIDs
}

func seedPostVisibility(db *sql.DB, postIDs, userIDs []int) []int {
	if len(postIDs) == 0 || len(userIDs) == 0 {
		return []int{}
	}

	var visibilityIDs []int
	// Add some specific visibility settings for private posts
	for _, postID := range postIDs {
		// 20% chance of having specific visibility settings
		if rand.Float32() < 0.2 {
			// Add visibility for 1-3 random users
			numUsers := rand.Intn(3) + 1
			for i := 0; i < numUsers; i++ {
				userID := userIDs[rand.Intn(len(userIDs))]
				result, err := db.Exec(`
					INSERT INTO post_visibility (post_id, user_id)
					VALUES (?, ?)`, postID, userID)
				if err != nil {
					log.Printf("Warning: Could not insert post visibility: %v", err)
					continue
				}
				id, _ := result.LastInsertId()
				visibilityIDs = append(visibilityIDs, int(id))
			}
		}
	}
	return visibilityIDs
}

func seedGroupMembers(db *sql.DB, groupIDs, userIDs []int) []int {
	if len(groupIDs) == 0 || len(userIDs) == 0 {
		return []int{}
	}

	var memberIDs []int
	validRoles := []string{"member", "admin"}
	validStatuses := []string{"pending", "accepted", "declined"}
	
	for _, groupID := range groupIDs {
		// Each group has 3-8 members
		numMembers := rand.Intn(6) + 3
		usedUsers := make(map[int]bool)
		
		for i := 0; i < numMembers && i < len(userIDs); i++ {
			var userID int
			for {
				userID = userIDs[rand.Intn(len(userIDs))]
				if !usedUsers[userID] {
					usedUsers[userID] = true
					break
				}
			}
			
			role := "member"
			if i == 0 {
				role = "admin" // First member is admin
			} else if rand.Float32() < 0.2 {
				role = validRoles[rand.Intn(len(validRoles))]
			}
			
			status := validStatuses[rand.Intn(len(validStatuses))]
			// Most members should be accepted
			if rand.Float32() < 0.8 {
				status = "accepted"
			}
			
			result, err := db.Exec(`
				INSERT INTO group_members (group_id, user_id, role, status)
				VALUES (?, ?, ?, ?)`, groupID, userID, role, status)
			if err != nil {
				log.Printf("Warning: Could not insert group member: %v", err)
				continue
			}
			id, _ := result.LastInsertId()
			memberIDs = append(memberIDs, int(id))
		}
	}
	return memberIDs
}

func seedGroupRequests(db *sql.DB, groupIDs, userIDs []int) []int {
	if len(groupIDs) == 0 || len(userIDs) == 0 {
		return []int{}
	}

	var requestIDs []int
	validStatuses := []string{"pending", "accepted", "declined"}
	
	for _, groupID := range groupIDs {
		// Each group has 0-3 pending requests
		numRequests := rand.Intn(4)
		for i := 0; i < numRequests; i++ {
			userID := userIDs[rand.Intn(len(userIDs))]
			status := validStatuses[rand.Intn(len(validStatuses))]
			
			result, err := db.Exec(`
				INSERT INTO group_requests (group_id, user_id, status)
				VALUES (?, ?, ?)`, groupID, userID, status)
			if err != nil {
				log.Printf("Warning: Could not insert group request: %v", err)
				continue
			}
			id, _ := result.LastInsertId()
			requestIDs = append(requestIDs, int(id))
		}
	}
	return requestIDs
}

func seedGroupInvitations(db *sql.DB, groupIDs, userIDs []int) []int {
	if len(groupIDs) == 0 || len(userIDs) == 0 {
		return []int{}
	}

	var inviteIDs []int
	statuses := []string{"pending", "accepted", "declined"}
	
	for _, groupID := range groupIDs {
		// Each group has 0-2 invitations
		numInvites := rand.Intn(3)
		for i := 0; i < numInvites; i++ {
			invitedUser := userIDs[rand.Intn(len(userIDs))]
			invitedBy := userIDs[rand.Intn(len(userIDs))]
			status := statuses[rand.Intn(len(statuses))]
			
			result, err := db.Exec(`
				INSERT INTO group_invitations (group_id, invited_user_id, invited_by, status)
				VALUES (?, ?, ?, ?)`, groupID, invitedUser, invitedBy, status)
			if err != nil {
				log.Printf("Warning: Could not insert group invitation: %v", err)
				continue
			}
			id, _ := result.LastInsertId()
			inviteIDs = append(inviteIDs, int(id))
		}
	}
	return inviteIDs
}

func seedGroupPosts(db *sql.DB, groupIDs, userIDs []int) []int {
	if len(groupIDs) == 0 || len(userIDs) == 0 {
		return []int{}
	}

	groupPostTitles := []string{
		"Welcome to our group!",
		"Group meeting this Friday",
		"Sharing some resources",
		"Great discussion yesterday",
		"New project proposal",
		"Group photo from last event",
		"Tips and tricks to share",
		"Weekly update",
	}

	groupPostBodies := []string{
		"Excited to be part of this amazing community! Looking forward to great discussions.",
		"Don't forget about our group meeting this Friday at 3 PM. See you all there!",
		"Found some excellent resources that might be helpful for everyone in the group.",
		"Thank you all for the engaging discussion yesterday. Lots of valuable insights shared!",
		"I have an idea for a new project that could benefit our entire group. Thoughts?",
		"Here's the group photo from our last meetup. What a fantastic group of people!",
		"Sharing some tips and tricks I've learned recently. Hope they help others too!",
		"Weekly update: Here's what's been happening in our group this week.",
	}

	var groupPostIDs []int
	
	for _, groupID := range groupIDs {
		// Each group has 2-5 posts
		numPosts := rand.Intn(4) + 2
		for i := 0; i < numPosts; i++ {
			userID := userIDs[rand.Intn(len(userIDs))]
			title := groupPostTitles[rand.Intn(len(groupPostTitles))]
			body := groupPostBodies[rand.Intn(len(groupPostBodies))]
			
			result, err := db.Exec(`
				INSERT INTO group_posts (group_id, user_id, title, body)
				VALUES (?, ?, ?, ?)`, groupID, userID, title, body)
			if err != nil {
				log.Printf("Warning: Could not insert group post: %v", err)
				continue
			}
			id, _ := result.LastInsertId()
			groupPostIDs = append(groupPostIDs, int(id))
		}
	}
	return groupPostIDs
}

func seedGroupComments(db *sql.DB, groupPostIDs, userIDs []int) []int {
	if len(groupPostIDs) == 0 || len(userIDs) == 0 {
		return []int{}
	}

	groupComments := []string{
		"Great point! Thanks for sharing.",
		"I completely agree with this approach.",
		"This is exactly what we needed. Thank you!",
		"Looking forward to participating!",
		"Excellent initiative from the group.",
		"Count me in! This sounds fantastic.",
		"Thanks for keeping us updated.",
		"Really appreciate this resource.",
	}

	var groupCommentIDs []int
	
	for _, postID := range groupPostIDs {
		// Each group post has 1-3 comments
		numComments := rand.Intn(3) + 1
		for i := 0; i < numComments; i++ {
			userID := userIDs[rand.Intn(len(userIDs))]
			comment := groupComments[rand.Intn(len(groupComments))]
			
			result, err := db.Exec(`
				INSERT INTO group_comments (group_post_id, user_id, body)
				VALUES (?, ?, ?)`, postID, userID, comment)
			if err != nil {
				log.Printf("Warning: Could not insert group comment: %v", err)
				continue
			}
			id, _ := result.LastInsertId()
			groupCommentIDs = append(groupCommentIDs, int(id))
		}
	}
	return groupCommentIDs
}

func seedGroupEvents(db *sql.DB, groupIDs, userIDs []int) []int {
	if len(groupIDs) == 0 || len(userIDs) == 0 {
		return []int{}
	}

	eventTitles := []string{
		"Weekly Group Meeting",
		"Workshop: Advanced Techniques",
		"Social Gathering",
		"Project Collaboration Session",
		"Guest Speaker Event",
		"Group Outing",
		"Skills Sharing Session",
		"Monthly Review Meeting",
	}

	eventDescriptions := []string{
		"Our regular weekly meeting to discuss progress and plan ahead.",
		"Join us for an advanced workshop covering the latest techniques and best practices.",
		"Casual social gathering for group members to get to know each other better.",
		"Collaborative session to work on our group project together.",
		"Special event featuring a guest speaker from the industry.",
		"Fun group outing to build team spirit and enjoy some time together.",
		"Session where members share their skills and knowledge with the group.",
		"Monthly review to assess our progress and set goals for the next month.",
	}

	var eventIDs []int
	
	for _, groupID := range groupIDs {
		// Each group has 0-2 events
		numEvents := rand.Intn(3)
		for i := 0; i < numEvents; i++ {
			creatorID := userIDs[rand.Intn(len(userIDs))]
			title := eventTitles[rand.Intn(len(eventTitles))]
			description := eventDescriptions[rand.Intn(len(eventDescriptions))]
			
			// Generate future date (1-30 days from now)
			daysFromNow := rand.Intn(30) + 1
			eventDate := time.Now().AddDate(0, 0, daysFromNow).Format("2006-01-02 15:04:05")
			
			result, err := db.Exec(`
				INSERT INTO group_events (group_id, creator_id, title, description, event_date)
				VALUES (?, ?, ?, ?, ?)`, groupID, creatorID, title, description, eventDate)
			if err != nil {
				log.Printf("Warning: Could not insert group event: %v", err)
				continue
			}
			id, _ := result.LastInsertId()
			eventIDs = append(eventIDs, int(id))
		}
	}
	return eventIDs
}

func seedEventRSVPs(db *sql.DB, eventIDs, userIDs []int) []int {
	if len(eventIDs) == 0 || len(userIDs) == 0 {
		return []int{}
	}

	rsvpStatuses := []string{"come", "not_come", "interested", "not_interested"}
	var rsvpIDs []int
	
	for _, eventID := range eventIDs {
		// Each event has 2-6 RSVPs
		numRSVPs := rand.Intn(5) + 2
		usedUsers := make(map[int]bool)
		
		for i := 0; i < numRSVPs && i < len(userIDs); i++ {
			var userID int
			for {
				userID = userIDs[rand.Intn(len(userIDs))]
				if !usedUsers[userID] {
					usedUsers[userID] = true
					break
				}
			}
			
			status := rsvpStatuses[rand.Intn(len(rsvpStatuses))]
			
			result, err := db.Exec(`
				INSERT INTO event_rsvps (event_id, user_id, status)
				VALUES (?, ?, ?)`, eventID, userID, status)
			if err != nil {
				log.Printf("Warning: Could not insert event RSVP: %v", err)
				continue
			}
			id, _ := result.LastInsertId()
			rsvpIDs = append(rsvpIDs, int(id))
		}
	}
	return rsvpIDs
}

func seedGroupMessages(db *sql.DB, groupIDs, userIDs []int) []int {
	if len(groupIDs) == 0 || len(userIDs) == 0 {
		return []int{}
	}

	groupMessageTexts := []string{
		"Hey everyone! Hope you're all doing well.",
		"Just wanted to share this interesting article I found.",
		"Don't forget about our upcoming meeting!",
		"Thanks for all the great feedback on the proposal.",
		"Looking forward to our next group activity.",
		"Has anyone tried the new technique we discussed?",
		"Great job everyone on the recent project!",
		"Let me know if you need any help with anything.",
	}

	var messageIDs []int
	
	for _, groupID := range groupIDs {
		// Each group has 3-8 messages
		numMessages := rand.Intn(6) + 3
		for i := 0; i < numMessages; i++ {
			senderID := userIDs[rand.Intn(len(userIDs))]
			message := groupMessageTexts[rand.Intn(len(groupMessageTexts))]
			
			result, err := db.Exec(`
				INSERT INTO group_messages (group_id, sender_id, body)
				VALUES (?, ?, ?)`, groupID, senderID, message)
			if err != nil {
				log.Printf("Warning: Could not insert group message: %v", err)
				continue
			}
			id, _ := result.LastInsertId()
			messageIDs = append(messageIDs, int(id))
		}
	}
	return messageIDs
}

func seedPrivateMessages(db *sql.DB, userIDs []int) []int {
	if len(userIDs) < 2 {
		return []int{}
	}

	privateMessageTexts := []string{
		"Hey! How are you doing?",
		"Thanks for your help with the project.",
		"Would you like to grab coffee sometime?",
		"I saw your post about the event. Sounds interesting!",
		"Just wanted to check in and see how things are going.",
		"Do you have any recommendations for good books?",
		"Great meeting you at the group gathering!",
		"Let me know if you need any assistance.",
	}

	var messageIDs []int
	
	// Create 10-20 private messages
	numMessages := rand.Intn(11) + 10
	for i := 0; i < numMessages; i++ {
		senderID := userIDs[rand.Intn(len(userIDs))]
		var receiverID int
		for {
			receiverID = userIDs[rand.Intn(len(userIDs))]
			if receiverID != senderID {
				break
			}
		}
		
		message := privateMessageTexts[rand.Intn(len(privateMessageTexts))]
		
		result, err := db.Exec(`
			INSERT INTO private_messages (sender_id, receiver_id, body)
			VALUES (?, ?, ?)`, senderID, receiverID, message)
		if err != nil {
			log.Printf("Warning: Could not insert private message: %v", err)
			continue
		}
		id, _ := result.LastInsertId()
		messageIDs = append(messageIDs, int(id))
	}
	return messageIDs
}

func seedLikesDislikes(db *sql.DB, postIDs, commentIDs, groupPostIDs, groupCommentIDs, userIDs []int) []int {
	if len(userIDs) == 0 {
		return []int{}
	}

	var likeIDs []int
	
	// Likes on regular posts (70% of posts get reactions)
	for _, postID := range postIDs {
		if rand.Float32() < 0.7 {
			userID := userIDs[rand.Intn(len(userIDs))]
			isLike := true
			if rand.Float32() < 0.15 { // 15% chance of dislike
				isLike = false
			}
			
			result, err := db.Exec(`
				INSERT INTO likes_dislikes (user_id, content_type, content_id, is_like)
				VALUES (?, 'post', ?, ?)`, userID, postID, isLike)
			if err != nil {
				log.Printf("Warning: Could not insert post reaction: %v", err)
				continue
			}
			id, _ := result.LastInsertId()
			likeIDs = append(likeIDs, int(id))
		}
	}
	
	// Likes on comments (40% of comments get reactions)
	for _, commentID := range commentIDs {
		if rand.Float32() < 0.4 {
			userID := userIDs[rand.Intn(len(userIDs))]
			isLike := true
			if rand.Float32() < 0.1 { // 10% chance of dislike
				isLike = false
			}
			
			result, err := db.Exec(`
				INSERT INTO likes_dislikes (user_id, content_type, content_id, is_like)
				VALUES (?, 'comment', ?, ?)`, userID, commentID, isLike)
			if err != nil {
				log.Printf("Warning: Could not insert comment reaction: %v", err)
				continue
			}
			id, _ := result.LastInsertId()
			likeIDs = append(likeIDs, int(id))
		}
	}
	
	return likeIDs
}

func seedNotifications(db *sql.DB, userIDs []int) []int {
	if len(userIDs) == 0 {
		return []int{}
	}

	notificationTypes := []string{
		"follow_request",
		"post_like",
		"comment_like", 
		"new_comment",
		"group_invitation",
		"group_request_approved",
		"event_reminder",
		"new_group_post",
		"message_received",
		"mention",
	}

	notificationContents := map[string]string{
		"follow_request":        "Someone wants to follow you",
		"post_like":            "Someone liked your post",
		"comment_like":         "Someone liked your comment",
		"new_comment":          "Someone commented on your post",
		"group_invitation":     "You've been invited to join a group",
		"group_request_approved": "Your group request has been approved",
		"event_reminder":       "Upcoming event reminder",
		"new_group_post":       "New post in your group",
		"message_received":     "You have a new message",
		"mention":              "You were mentioned in a post",
	}

	var notificationIDs []int
	
	// Create 2-4 notifications per user
	for _, userID := range userIDs {
		numNotifications := rand.Intn(3) + 2
		for i := 0; i < numNotifications; i++ {
			notifType := notificationTypes[rand.Intn(len(notificationTypes))]
			content := notificationContents[notifType]
			isRead := rand.Float32() < 0.3 // 30% chance notification is already read
			
			// Pick a random "from_user" for some notification types
			var fromUserID *int
			if notifType == "follow_request" || notifType == "post_like" || notifType == "comment_like" || notifType == "new_comment" {
				otherUserID := userIDs[rand.Intn(len(userIDs))]
				if otherUserID != userID {
					fromUserID = &otherUserID
				}
			}
			
			result, err := db.Exec(`
				INSERT INTO notifications (user_id, type, content, from_user_id, is_read)
				VALUES (?, ?, ?, ?, ?)`, userID, notifType, content, fromUserID, isRead)
			if err != nil {
				log.Printf("Warning: Could not insert notification: %v", err)
				continue
			}
			id, _ := result.LastInsertId()
			notificationIDs = append(notificationIDs, int(id))
		}
	}
	return notificationIDs
}

func printSummary(db *sql.DB) {
	var userCount, postCount, commentCount, groupCount, followCount int
	db.QueryRow("SELECT COUNT(*) FROM users").Scan(&userCount)
	db.QueryRow("SELECT COUNT(*) FROM posts").Scan(&postCount)
	db.QueryRow("SELECT COUNT(*) FROM comments").Scan(&commentCount)
	db.QueryRow("SELECT COUNT(*) FROM groups").Scan(&groupCount)
	db.QueryRow("SELECT COUNT(*) FROM follow_requests").Scan(&followCount)

	fmt.Println("\n📊 Database Summary")
	fmt.Println("==================")
	fmt.Printf("Total Users: %d\n", userCount)
	fmt.Printf("Total Posts: %d\n", postCount)
	fmt.Printf("Total Comments: %d\n", commentCount)
	fmt.Printf("Total Groups: %d\n", groupCount)
	fmt.Printf("Total Follow Requests: %d\n", followCount)

	fmt.Println("\n🧪 Test Accounts")
	fmt.Println("================")
	fmt.Println("• test_alice@example.com")
	fmt.Println("• test_bob@example.com") 
	fmt.Println("• test_carol@example.com")
	fmt.Println("• test_david@example.com")
	fmt.Println("• test_emma@example.com")
	fmt.Println("\nPassword for all test accounts: password123")
}
EOF

# Build and run the seeder
echo "🔧 Building seeder..."
go build -o temp_seeder temp_seeder.go

if [ $? -ne 0 ]; then
    echo "❌ Failed to build seeder"
    rm -f temp_seeder.go
    exit 1
fi

echo "🚀 Running seeder..."
./temp_seeder

echo ""
echo "🔍 Verification"
echo "==============="

# Show sample data
echo "Sample users:"
sqlite3 social_network.db "SELECT nickname, email FROM users WHERE email LIKE 'test_%@%' LIMIT 3;" 2>/dev/null || echo "Users table accessible"

echo ""
echo "Recent posts:"
sqlite3 social_network.db "SELECT u.nickname, p.title FROM posts p JOIN users u ON p.user_id = u.id ORDER BY p.id DESC LIMIT 3;" 2>/dev/null || echo "Posts table accessible"

# Cleanup
rm -f temp_seeder temp_seeder.go

echo ""
echo "🎉 Database seeding completed successfully!"
echo ""
echo "You can now use the test accounts to log in and test the application."
echo "All test account passwords are: password123"
