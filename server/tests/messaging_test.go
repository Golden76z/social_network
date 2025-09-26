package tests

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Golden76z/social-network/api"
	"github.com/Golden76z/social-network/db"
	"github.com/Golden76z/social-network/middleware"
	"github.com/Golden76z/social-network/models"
	_ "github.com/mattn/go-sqlite3"
)

// TestMessagingFlow tests the complete messaging flow
func TestMessagingFlow(t *testing.T) {
	// Setup test database
	testDB := setupTestDB(t)
	defer testDB.Close()

	// Create test users
	user1ID := createTestUser(t, testDB, "user1@test.com", "password123")
	user2ID := createTestUser(t, testDB, "user2@test.com", "password123")

	// Generate JWT tokens
	token1, err := generateTestToken(t, user1ID, "user1@test.com")
	if err != nil {
		t.Fatalf("Failed to generate token 1: %v", err)
	}

	token2, err := generateTestToken(t, user2ID, "user2@test.com")
	if err != nil {
		t.Fatalf("Failed to generate token 2: %v", err)
	}

	t.Logf("Created users: user1=%d, user2=%d", user1ID, user2ID)
	t.Logf("Generated tokens: token1=%s, token2=%s", token1[:20]+"...", token2[:20]+"...")

	// Test 1: Get conversations (should be empty initially)
	t.Run("GetConversations_Empty", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/chat/conversations", nil)
		req.AddCookie(&http.Cookie{Name: "jwt_token", Value: token1})

		w := httptest.NewRecorder()
		handler := middleware.AuthMiddleware()(http.HandlerFunc(api.GetConversationsHandler))
		handler.ServeHTTP(w, req)

		t.Logf("GetConversations response status: %d", w.Code)
		t.Logf("GetConversations response body: %s", w.Body.String())

		if w.Code != http.StatusOK {
			t.Errorf("Expected status 200, got %d", w.Code)
		}

		var conversations []db.Conversation
		if err := json.Unmarshal(w.Body.Bytes(), &conversations); err != nil {
			t.Errorf("Failed to unmarshal conversations: %v", err)
		}

		if len(conversations) != 0 {
			t.Errorf("Expected 0 conversations, got %d", len(conversations))
		}
	})

	// Test 2: Send a message from user1 to user2
	t.Run("SendMessage_User1ToUser2", func(t *testing.T) {
		messageData := map[string]interface{}{
			"receiver_id": user2ID,
			"body":        "Hello from user1 to user2!",
		}

		jsonData, _ := json.Marshal(messageData)
		req := httptest.NewRequest("POST", "/api/chat/message", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		req.AddCookie(&http.Cookie{Name: "jwt_token", Value: token1})

		w := httptest.NewRecorder()
		handler := middleware.AuthMiddleware()(http.HandlerFunc(api.SendMessageHandler))
		handler.ServeHTTP(w, req)

		t.Logf("SendMessage response status: %d", w.Code)
		t.Logf("SendMessage response body: %s", w.Body.String())

		if w.Code != http.StatusOK {
			t.Errorf("Expected status 200, got %d. Response: %s", w.Code, w.Body.String())
		}
	})

	// Test 3: Get messages between user1 and user2
	t.Run("GetMessages_User1ToUser2", func(t *testing.T) {
		req := httptest.NewRequest("GET", fmt.Sprintf("/api/chat/messages?user_id=%d", user2ID), nil)
		req.AddCookie(&http.Cookie{Name: "jwt_token", Value: token1})

		w := httptest.NewRecorder()
		handler := middleware.AuthMiddleware()(http.HandlerFunc(api.GetMessagesHandler))
		handler.ServeHTTP(w, req)

		t.Logf("GetMessages response status: %d", w.Code)
		t.Logf("GetMessages response body: %s", w.Body.String())

		if w.Code != http.StatusOK {
			t.Errorf("Expected status 200, got %d", w.Code)
		}

		var messages []models.PrivateMessage
		if err := json.Unmarshal(w.Body.Bytes(), &messages); err != nil {
			t.Errorf("Failed to unmarshal messages: %v", err)
		}

		if len(messages) != 1 {
			t.Errorf("Expected 1 message, got %d", len(messages))
		}

		if len(messages) > 0 {
			if messages[0].Body != "Hello from user1 to user2!" {
				t.Errorf("Expected message body 'Hello from user1 to user2!', got '%s'", messages[0].Body)
			}
			if messages[0].SenderID != user1ID {
				t.Errorf("Expected sender ID %d, got %d", user1ID, messages[0].SenderID)
			}
			if messages[0].ReceiverID != user2ID {
				t.Errorf("Expected receiver ID %d, got %d", user2ID, messages[0].ReceiverID)
			}
		}
	})

	// Test 4: Get conversations (should now have one conversation)
	t.Run("GetConversations_WithMessage", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/chat/conversations", nil)
		req.AddCookie(&http.Cookie{Name: "jwt_token", Value: token1})

		w := httptest.NewRecorder()
		handler := middleware.AuthMiddleware()(http.HandlerFunc(api.GetConversationsHandler))
		handler.ServeHTTP(w, req)

		t.Logf("GetConversations response status: %d", w.Code)
		t.Logf("GetConversations response body: %s", w.Body.String())

		if w.Code != http.StatusOK {
			t.Errorf("Expected status 200, got %d", w.Code)
		}

		var conversations []db.Conversation
		if err := json.Unmarshal(w.Body.Bytes(), &conversations); err != nil {
			t.Errorf("Failed to unmarshal conversations: %v", err)
		}

		if len(conversations) != 1 {
			t.Errorf("Expected 1 conversation, got %d", len(conversations))
		}

		if len(conversations) > 0 {
			if conversations[0].OtherUserID != user2ID {
				t.Errorf("Expected other user ID %d, got %d", user2ID, conversations[0].OtherUserID)
			}
			if conversations[0].LastMessage != "Hello from user1 to user2!" {
				t.Errorf("Expected last message 'Hello from user1 to user2!', got '%s'", conversations[0].LastMessage)
			}
		}
	})

	// Test 5: Send a reply from user2 to user1
	t.Run("SendMessage_User2ToUser1", func(t *testing.T) {
		messageData := map[string]interface{}{
			"receiver_id": user1ID,
			"body":        "Hello back from user2!",
		}

		jsonData, _ := json.Marshal(messageData)
		req := httptest.NewRequest("POST", "/api/chat/message", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		req.AddCookie(&http.Cookie{Name: "jwt_token", Value: token2})

		w := httptest.NewRecorder()
		handler := middleware.AuthMiddleware()(http.HandlerFunc(api.SendMessageHandler))
		handler.ServeHTTP(w, req)

		t.Logf("SendMessage reply response status: %d", w.Code)
		t.Logf("SendMessage reply response body: %s", w.Body.String())

		if w.Code != http.StatusOK {
			t.Errorf("Expected status 200, got %d. Response: %s", w.Code, w.Body.String())
		}
	})

	// Test 6: Get messages between user1 and user2 (should now have 2 messages)
	t.Run("GetMessages_BothDirections", func(t *testing.T) {
		req := httptest.NewRequest("GET", fmt.Sprintf("/api/chat/messages?user_id=%d", user2ID), nil)
		req.AddCookie(&http.Cookie{Name: "jwt_token", Value: token1})

		w := httptest.NewRecorder()
		handler := middleware.AuthMiddleware()(http.HandlerFunc(api.GetMessagesHandler))
		handler.ServeHTTP(w, req)

		t.Logf("GetMessages both directions response status: %d", w.Code)
		t.Logf("GetMessages both directions response body: %s", w.Body.String())

		if w.Code != http.StatusOK {
			t.Errorf("Expected status 200, got %d", w.Code)
		}

		var messages []models.PrivateMessage
		if err := json.Unmarshal(w.Body.Bytes(), &messages); err != nil {
			t.Errorf("Failed to unmarshal messages: %v", err)
		}

		if len(messages) != 2 {
			t.Errorf("Expected 2 messages, got %d", len(messages))
		}

		// Messages should be ordered by created_at DESC (newest first)
		if len(messages) >= 2 {
			// First message should be the reply from user2
			if messages[0].Body != "Hello back from user2!" {
				t.Errorf("Expected first message body 'Hello back from user2!', got '%s'", messages[0].Body)
			}
			if messages[0].SenderID != user2ID {
				t.Errorf("Expected first message sender ID %d, got %d", user2ID, messages[0].SenderID)
			}
		}
	})
}

// TestWebSocketMessaging tests WebSocket message handling
func TestWebSocketMessaging(t *testing.T) {
	// Setup test database
	testDB := setupTestDB(t)
	defer testDB.Close()

	// Create test users
	user1ID := createTestUser(t, testDB, "user1@test.com", "password123")
	user2ID := createTestUser(t, testDB, "user2@test.com", "password123")

	t.Logf("Testing WebSocket messaging between users: %d and %d", user1ID, user2ID)

	// Test database message creation directly
	t.Run("CreatePrivateMessage_Direct", func(t *testing.T) {
		_, err := db.DBService.CreatePrivateMessage(user1ID, user2ID, "Test WebSocket message")
		if err != nil {
			t.Errorf("Failed to create private message: %v", err)
		}

		// Verify message was created
		messages, err := db.DBService.GetMessagesBetweenUsers(user1ID, user2ID, 10, 0)
		if err != nil {
			t.Errorf("Failed to get messages: %v", err)
		}

		if len(messages) != 1 {
			t.Errorf("Expected 1 message, got %d", len(messages))
		}

		if len(messages) > 0 {
			if messages[0].Body != "Test WebSocket message" {
				t.Errorf("Expected message body 'Test WebSocket message', got '%s'", messages[0].Body)
			}
		}
	})
}

// Helper functions
func setupTestDB(t *testing.T) *sql.DB {
	// Create in-memory SQLite database for testing
	testDB, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatalf("Failed to create test database: %v", err)
	}

	// Create necessary tables for testing
	_, err = testDB.Exec(`
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
		
		CREATE TABLE private_messages (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			sender_id INTEGER NOT NULL,
			receiver_id INTEGER NOT NULL,
			body TEXT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);
	`)
	if err != nil {
		t.Fatalf("Failed to create tables: %v", err)
	}

	// Initialize database service with test database
	db.DBService = &db.Service{DB: testDB}

	return testDB
}

func createTestUser(t *testing.T, db *sql.DB, email, password string) int {
	// For testing, use a simple password hash
	// In production, you'd use proper password hashing
	hashedPassword := "test_hash_" + password

	// Insert user
	result, err := db.Exec(`
		INSERT INTO users (email, password, first_name, last_name, nickname, is_private, date_of_birth)
		VALUES (?, ?, ?, ?, ?, ?, ?)`,
		email, hashedPassword, "Test", "User", email[:5], false, "1990-01-01")
	if err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}

	userID, err := result.LastInsertId()
	if err != nil {
		t.Fatalf("Failed to get user ID: %v", err)
	}

	return int(userID)
}

func generateTestToken(t *testing.T, userID int, username string) (string, error) {
	// For testing purposes, we'll create a simple token
	// In a real implementation, you'd use the actual JWT generation
	return fmt.Sprintf("test_token_%d_%s", userID, username), nil
}
