package utils

import (
	"regexp"
	"strings"
	"time"
)

// ValidateEmail checks if email format is valid
func ValidateEmail(email string) bool {
	if len(email) == 0 {
		return false
	}
	
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	return emailRegex.MatchString(email)
}

// ValidateNickname checks if nickname is valid (length, characters)
func ValidateNickname(nickname string) bool {
	if len(nickname) < 3 || len(nickname) > 20 {
		return false
	}
	
	// Allow alphanumeric, underscore, hyphen
	nicknameRegex := regexp.MustCompile(`^[a-zA-Z0-9_-]+$`)
	return nicknameRegex.MatchString(nickname)
}

// ValidateName checks if first/last name is valid
func ValidateName(name string) bool {
	if len(name) == 0 || len(name) > 50 {
		return false
	}
	
	// Allow letters, spaces, hyphens, apostrophes
	nameRegex := regexp.MustCompile(`^[a-zA-Z\s'-]+$`)
	return nameRegex.MatchString(name)
}

// ValidateDateOfBirth checks if date format is valid (YYYY-MM-DD)
func ValidateDateOfBirth(dateStr string) bool {
	if len(dateStr) == 0 {
		return false
	}
	
	// Parse date
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return false
	}
	
	// Check if date is not in the future and not too old (e.g., 120 years)
	now := time.Now()
	minDate := now.AddDate(-120, 0, 0)
	
	return date.After(minDate) && date.Before(now)
}

// ValidateBio checks if bio length is appropriate
func ValidateBio(bio string) bool {
	return len(bio) <= 500 // Max 500 characters
}

// SanitizeString removes extra whitespace and potentially harmful characters
func SanitizeString(input string) string {
	// Trim whitespace
	sanitized := strings.TrimSpace(input)
	
	// Remove null bytes and other control characters
	sanitized = strings.ReplaceAll(sanitized, "\x00", "")
	
	return sanitized
}
