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

// ValidatePassword checks if password meets security requirements
// Currently validates plaintext passwords only
func ValidatePassword(password string) bool {
	if len(password) == 0 {
		return false
	}

	// TODO: Uncomment when frontend hashing is implemented
	// Check if password is already hashed (bcrypt format)
	// if isBcryptHash(password) {
	// 	return true // Accept valid bcrypt hashes
	// }

	// Validate plaintext password requirements
	if len(password) < 8 {
		return false
	}

	// Check for at least one uppercase letter
	hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(password)
	if !hasUpper {
		return false
	}

	// Check for at least one lowercase letter
	hasLower := regexp.MustCompile(`[a-z]`).MatchString(password)
	if !hasLower {
		return false
	}

	// Check for at least one digit
	hasDigit := regexp.MustCompile(`[0-9]`).MatchString(password)
	if !hasDigit {
		return false
	}

	// Check for at least one special character
	hasSpecial := regexp.MustCompile(`[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]`).MatchString(password)
	if !hasSpecial {
		return false
	}

	return true
}

// isBcryptHash checks if a string is a valid bcrypt hash format
// DEACTIVATED: Uncomment when frontend hashing is implemented
func isBcryptHash(password string) bool {
	// Bcrypt hashes have a specific format: $2a$10$... or $2b$10$... etc.
	// They are typically 60 characters long
	if len(password) != 60 {
		return false
	}

	// Check bcrypt format pattern
	bcryptPattern := regexp.MustCompile(`^\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}$`)
	return bcryptPattern.MatchString(password)
}

// GetPasswordValidationMessage returns detailed password requirements message
func GetPasswordValidationMessage() string {
	return "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character"
}

// SanitizeString removes extra whitespace and potentially harmful characters
func SanitizeString(input string) string {
	// Trim whitespace
	sanitized := strings.TrimSpace(input)

	// Remove null bytes and other control characters
	sanitized = strings.ReplaceAll(sanitized, "\x00", "")

	return sanitized
}

func ValidatePostTitle(title string, maxLength int) bool {
	return len(title) > 0 && len(title) <= maxLength
}

func ValidatePostBody(body string, maxLength int) bool {
	return len(body) > 0 && len(body) <= maxLength
}

func ValidatePostImageCount(images []string, maxCount int) bool {
	return len(images) <= maxCount
}

// GenerateTempNickname creates a temporary nickname from first name and last name
// Format: first letter of first name + last name (lowercase)
// Example: "Clark Kent" -> "ckent"
func GenerateTempNickname(firstName, lastName string) string {
	if len(firstName) == 0 || len(lastName) == 0 {
		return ""
	}

	// Get first letter of first name and convert to lowercase
	firstLetter := strings.ToLower(string(firstName[0]))

	// Convert last name to lowercase
	lastNameLower := strings.ToLower(lastName)

	return firstLetter + lastNameLower
}
