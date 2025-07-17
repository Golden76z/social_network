package main

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

	if err := seedPosts(db.DBService); err != nil {
		log.Fatal("Failed to seed posts:", err)
	}
	if err := seedGroupPosts(db.DBService); err != nil {
		log.Fatal("Failed to seed group posts:", err)
	}
	if err := seedPostImages(db.DBService); err != nil {
		log.Fatal("Failed to seed post images:", err)
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
			continue
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
			continue
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
			Image:      "",
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
			Image:   "",
		}
		if err := s.CreateGroupPost(req, userID); err != nil {
			log.Printf("Error creating group post (line %d): %v", i+1, err)
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
