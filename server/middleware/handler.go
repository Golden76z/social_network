package middleware

import (
	"encoding/json"
	"fmt"
	"net/http"
	"reflect"
	"strings"

	"github.com/Golden76z/social-network/utils"
)

// HandlerFunc represents a handler function that takes a validated request
type HandlerFunc[T any] func(w http.ResponseWriter, r *http.Request, req T)

// ValidationFunc represents a validation function for request data
type ValidationFunc[T any] func(req T) error

// HandlerConfig contains configuration for the handler factory
type HandlerConfig struct {
	AllowedMethods []string
	RequireAuth    bool
	SanitizeInput  bool
}

// DefaultHandlerConfig returns a default configuration
func DefaultHandlerConfig() *HandlerConfig {
	return &HandlerConfig{
		AllowedMethods: []string{http.MethodPost},
		RequireAuth:    false,
		SanitizeInput:  true,
	}
}

// CreateHandler creates a standardized HTTP handler with common middleware
func CreateHandler[T any](
	handler HandlerFunc[T],
	validate ValidationFunc[T],
	config *HandlerConfig,
) http.HandlerFunc {
	if config == nil {
		config = DefaultHandlerConfig()
	}

	return func(w http.ResponseWriter, r *http.Request) {
		// 1. Method validation
		if !isMethodAllowed(r.Method, config.AllowedMethods) {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// 2. Authentication check (if required)
		if config.RequireAuth {
			if !isAuthenticated(r) {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}
		}

		// 3. JSON decoding
		var req T
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON format", http.StatusBadRequest)
			return
		}

		// 4. Input sanitization (if enabled)
		if config.SanitizeInput {
			sanitizeRequest(&req)
		}

		// 5. Validation
		if validate != nil {
			if err := validate(req); err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}
		}

		// 6. Call the actual handler
		handler(w, r, req)
	}
}

// CreateGetHandler creates a handler for GET requests (no body decoding)
func CreateGetHandler(
	handler func(w http.ResponseWriter, r *http.Request),
	config *HandlerConfig,
) http.HandlerFunc {
	if config == nil {
		config = &HandlerConfig{
			AllowedMethods: []string{http.MethodGet},
			RequireAuth:    false,
			SanitizeInput:  false,
		}
	}

	return func(w http.ResponseWriter, r *http.Request) {
		// 1. Method validation
		if !isMethodAllowed(r.Method, config.AllowedMethods) {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// 2. Authentication check (if required)
		if config.RequireAuth {
			if !isAuthenticated(r) {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}
		}

		// 3. Call the actual handler
		handler(w, r)
	}
}

// Helper functions

func isMethodAllowed(method string, allowedMethods []string) bool {
	for _, allowed := range allowedMethods {
		if method == allowed {
			return true
		}
	}
	return false
}

func isAuthenticated(r *http.Request) bool {
	// Check for JWT token in cookie
	token, err := r.Cookie("jwt_token")
	if err != nil {
		return false
	}

	// Validate token
	_, err = utils.ValidateToken(token.Value)
	return err == nil
}

func sanitizeRequest[T any](req *T) {
	// Use reflection to sanitize string fields
	v := reflect.ValueOf(req).Elem()
	t := v.Type()

	for i := 0; i < v.NumField(); i++ {
		field := v.Field(i)
		fieldType := t.Field(i)

		// Only sanitize string fields
		if field.Kind() == reflect.String && field.CanSet() {
			// Check if field has a "sanitize" tag
			if fieldType.Tag.Get("sanitize") == "true" || fieldType.Tag.Get("sanitize") == "" {
				originalValue := field.String()
				sanitizedValue := utils.SanitizeString(originalValue)
				field.SetString(sanitizedValue)
			}
		}
	}
}

// Common validation functions

// ValidateRequiredFields validates that required string fields are not empty
func ValidateRequiredFields[T any](req T, fields ...string) error {
	v := reflect.ValueOf(req)
	t := reflect.TypeOf(req)

	for _, fieldName := range fields {
		_, found := t.FieldByName(fieldName)
		if !found {
			continue
		}

		fieldValue := v.FieldByName(fieldName)
		if fieldValue.Kind() == reflect.String {
			value := fieldValue.String()
			if strings.TrimSpace(value) == "" {
				return fmt.Errorf("%s is required", strings.ToLower(fieldName))
			}
		}
	}

	return nil
}

// ValidateLength validates string field length
func ValidateLength[T any](req T, fieldName string, min, max int) error {
	v := reflect.ValueOf(req)
	fieldValue := v.FieldByName(fieldName)

	if fieldValue.Kind() == reflect.String {
		value := fieldValue.String()
		length := len(strings.TrimSpace(value))

		if length < min {
			return fmt.Errorf("%s must be at least %d characters", strings.ToLower(fieldName), min)
		}
		if length > max {
			return fmt.Errorf("%s must be no more than %d characters", strings.ToLower(fieldName), max)
		}
	}

	return nil
}

// ValidateEmail validates email format
func ValidateEmail[T any](req T, fieldName string) error {
	v := reflect.ValueOf(req)
	fieldValue := v.FieldByName(fieldName)

	if fieldValue.Kind() == reflect.String {
		email := fieldValue.String()
		if !utils.ValidateEmail(email) {
			return fmt.Errorf("invalid email format")
		}
	}

	return nil
}

// ValidateUsername validates username format
func ValidateUsername[T any](req T, fieldName string) error {
	v := reflect.ValueOf(req)
	fieldValue := v.FieldByName(fieldName)

	if fieldValue.Kind() == reflect.String {
		username := fieldValue.String()
		if !utils.ValidateNickname(username) {
			return fmt.Errorf("invalid username format")
		}
	}

	return nil
}
