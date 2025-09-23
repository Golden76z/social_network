package tests

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Golden76z/social-network/middleware"
)

// Test request struct
type TestRequest struct {
	Username string `json:"username" sanitize:"true"`
	Password string `json:"password"`
	Email    string `json:"email" sanitize:"true"`
}

func TestCreateHandler(t *testing.T) {
	// Test handler function
	testHandler := func(w http.ResponseWriter, r *http.Request, req TestRequest) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"message":  "Success",
			"username": req.Username,
		})
	}

	// Test validation function
	validateRequest := func(req TestRequest) error {
		return middleware.ValidateRequiredFields(req, "Username", "Password")
	}

	// Create handler with middleware
	handler := middleware.CreateHandler(testHandler, validateRequest, &middleware.HandlerConfig{
		AllowedMethods: []string{http.MethodPost},
		RequireAuth:    false,
		SanitizeInput:  true,
	})

	t.Run("should handle valid POST request", func(t *testing.T) {
		reqBody := TestRequest{
			Username: "testuser",
			Password: "testpass123",
			Email:    "test@example.com",
		}

		jsonBody, _ := json.Marshal(reqBody)
		req := httptest.NewRequest(http.MethodPost, "/test", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		handler(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
		}

		var response map[string]string
		json.Unmarshal(w.Body.Bytes(), &response)

		if response["username"] != "testuser" {
			t.Errorf("Expected username 'testuser', got '%s'", response["username"])
		}
	})

	t.Run("should reject non-POST methods", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/test", nil)
		w := httptest.NewRecorder()
		handler(w, req)

		if w.Code != http.StatusMethodNotAllowed {
			t.Errorf("Expected status %d, got %d", http.StatusMethodNotAllowed, w.Code)
		}
	})

	t.Run("should reject invalid JSON", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/test", bytes.NewBufferString("invalid json"))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		handler(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("Expected status %d, got %d", http.StatusBadRequest, w.Code)
		}
	})

	t.Run("should reject request with missing required fields", func(t *testing.T) {
		reqBody := TestRequest{
			Username: "testuser",
			// Password missing
		}

		jsonBody, _ := json.Marshal(reqBody)
		req := httptest.NewRequest(http.MethodPost, "/test", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		handler(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("Expected status %d, got %d", http.StatusBadRequest, w.Code)
		}
	})
}

func TestCreateGetHandler(t *testing.T) {
	// Test GET handler function
	testHandler := func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "GET Success",
		})
	}

	// Create GET handler
	handler := middleware.CreateGetHandler(testHandler, &middleware.HandlerConfig{
		AllowedMethods: []string{http.MethodGet},
		RequireAuth:    false,
	})

	t.Run("should handle valid GET request", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/test", nil)
		w := httptest.NewRecorder()
		handler(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
		}

		var response map[string]string
		json.Unmarshal(w.Body.Bytes(), &response)

		if response["message"] != "GET Success" {
			t.Errorf("Expected message 'GET Success', got '%s'", response["message"])
		}
	})

	t.Run("should reject non-GET methods", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/test", nil)
		w := httptest.NewRecorder()
		handler(w, req)

		if w.Code != http.StatusMethodNotAllowed {
			t.Errorf("Expected status %d, got %d", http.StatusMethodNotAllowed, w.Code)
		}
	})
}

func TestValidateRequiredFields(t *testing.T) {
	t.Run("should validate required fields", func(t *testing.T) {
		req := TestRequest{
			Username: "testuser",
			Password: "testpass",
		}

		err := middleware.ValidateRequiredFields(req, "Username", "Password")
		if err != nil {
			t.Errorf("Expected no error, got %v", err)
		}
	})

	t.Run("should return error for missing required fields", func(t *testing.T) {
		req := TestRequest{
			Username: "testuser",
			// Password missing
		}

		err := middleware.ValidateRequiredFields(req, "Username", "Password")
		if err == nil {
			t.Error("Expected error for missing required field")
		}

		if err.Error() != "password is required" {
			t.Errorf("Expected 'password is required', got '%s'", err.Error())
		}
	})

	t.Run("should return error for empty required fields", func(t *testing.T) {
		req := TestRequest{
			Username: "testuser",
			Password: "   ", // Empty after trim
		}

		err := middleware.ValidateRequiredFields(req, "Username", "Password")
		if err == nil {
			t.Error("Expected error for empty required field")
		}
	})
}

func TestValidateLength(t *testing.T) {
	t.Run("should validate field length", func(t *testing.T) {
		req := TestRequest{
			Username: "testuser",
		}

		err := middleware.ValidateLength(req, "Username", 3, 20)
		if err != nil {
			t.Errorf("Expected no error, got %v", err)
		}
	})

	t.Run("should return error for field too short", func(t *testing.T) {
		req := TestRequest{
			Username: "ab", // Too short
		}

		err := middleware.ValidateLength(req, "Username", 3, 20)
		if err == nil {
			t.Error("Expected error for field too short")
		}
	})

	t.Run("should return error for field too long", func(t *testing.T) {
		req := TestRequest{
			Username: "thisusernameistoolong", // Too long
		}

		err := middleware.ValidateLength(req, "Username", 3, 20)
		if err == nil {
			t.Error("Expected error for field too long")
		}
	})
}

func TestValidateEmail(t *testing.T) {
	t.Run("should validate correct email", func(t *testing.T) {
		req := TestRequest{
			Email: "test@example.com",
		}

		err := middleware.ValidateEmail(req, "Email")
		if err != nil {
			t.Errorf("Expected no error, got %v", err)
		}
	})

	t.Run("should return error for invalid email", func(t *testing.T) {
		req := TestRequest{
			Email: "invalid-email",
		}

		err := middleware.ValidateEmail(req, "Email")
		if err == nil {
			t.Error("Expected error for invalid email")
		}
	})
}

func TestValidateUsername(t *testing.T) {
	t.Run("should validate correct username", func(t *testing.T) {
		req := TestRequest{
			Username: "testuser123",
		}

		err := middleware.ValidateUsername(req, "Username")
		if err != nil {
			t.Errorf("Expected no error, got %v", err)
		}
	})

	t.Run("should return error for invalid username", func(t *testing.T) {
		req := TestRequest{
			Username: "ab", // Too short
		}

		err := middleware.ValidateUsername(req, "Username")
		if err == nil {
			t.Error("Expected error for invalid username")
		}
	})
}
