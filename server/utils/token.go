package utils

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"net/http"
	"time"

	"github.com/Golden76z/social-network/db"
	"github.com/golang-jwt/jwt/v5"
)

// Custom claims for JWT
type JWTClaims struct {
	Username string `json:"username"`
	UserID   int    `json:"user_id"`
	jwt.RegisteredClaims
}

// Interface for config to avoid circular imports
type configInterface interface {
	GetJwtExpiration() time.Duration
	GetJwtPrivateKey() interface{}
	GetJwtPublicKey() interface{}
	GetEnvironment() string
	GetPostMaxLength() int
	GetMaxFileSizeMB() int
}

// Global config instance (set this in main.go)
var globalConfig configInterface

// GenerateSecureKey creates a random 256-bit key for JWT signing (same as before)
// kept for backward compatibility
func GenerateSecureKey() (string, error) {
	key := make([]byte, 32) // 256-bit key
	_, err := rand.Read(key)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(key), nil
}

// JWTGeneration creates a signed JWT token using golang-jwt with ECDSA
func JWTGeneration(username string, w http.ResponseWriter) (string, error) {
	config := getConfig()

	// Get user_id with the username
	userID, err := db.DBService.GetUserIDByUsername(username)
	if err != nil {
		return "", err
	}

	// Create claims
	claims := &JWTClaims{
		Username: username,
		UserID:   int(userID),
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(config.GetJwtExpiration())),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "social-network",
		},
	}

	// Create token with ECDSA signing method
	token := jwt.NewWithClaims(jwt.SigningMethodES256, claims)

	// Sign token with private key
	tokenString, err := token.SignedString(config.GetJwtPrivateKey())
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// ValidateToken verifies a JWT token using golang-jwt
func ValidateToken(tokenString string) (*JWTClaims, error) {
	config := getConfig()

	// Parse token with custom claims
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if _, ok := token.Method.(*jwt.SigningMethodECDSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return config.GetJwtPublicKey(), nil
	})

	if err != nil {
		return nil, err
	}

	// Extract claims
	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

// TokenInformations extracts JWT information from request
func TokenInformations(w http.ResponseWriter, r *http.Request) (*JWTClaims, error) {
	cookie, err := r.Cookie("jwt_token")
	if err != nil {
		return nil, fmt.Errorf("missing token")
	}

	claims, err := ValidateToken(cookie.Value)
	if err != nil {
		return nil, fmt.Errorf("invalid token: %v", err)
	}

	return claims, nil
}

// CookieSession creates JWT and stores in cookie + database
func CookieSession(username string, w http.ResponseWriter) error {
	config := getConfig()

	// Create JWT token
	token, err := JWTGeneration(username, w)
	if err != nil {
		fmt.Println("Error generating JWT:", err)
		return err
	}

	// Get user_id
	userID, err := db.DBService.GetUserIDByUsername(username)
	if err != nil {
		return err
	}

	// Store session in database
	err = db.DBService.CreateSession(int(userID), token, config.GetJwtExpiration())
	if err != nil {
		return err
	}

	// Set cookie with environment-specific settings
	secure := config.GetEnvironment() == "production"

	http.SetCookie(w, &http.Cookie{
		Name:     "jwt_token",
		Value:    token,
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
		Path:     "/",
		MaxAge:   int(config.GetJwtExpiration().Seconds()),
	})

	return nil
}

// GetUserFromJWT extracts user information from JWT token in request cookie
func GetUserFromJWT(r *http.Request) (*JWTClaims, error) {
	cookie, err := r.Cookie("jwt_token")
	if err != nil {
		return nil, fmt.Errorf("missing JWT token in cookie")
	}

	claims, err := ValidateToken(cookie.Value)
	if err != nil {
		return nil, fmt.Errorf("invalid JWT token: %v", err)
	}

	return claims, nil
}

// GetUserIDFromJWT extracts just the user ID from JWT token in request cookie
func GetUserIDFromJWT(r *http.Request) (int, error) {
	claims, err := GetUserFromJWT(r)
	if err != nil {
		return 0, err
	}
	return claims.UserID, nil
}

// GetUserIDFromTokenString extracts user ID from a JWT token string
func GetUserIDFromTokenString(tokenString string) (int, error) {
	claims, err := ValidateToken(tokenString)
	if err != nil {
		return 0, err
	}
	return claims.UserID, nil
}

// Helper function to get config (avoiding circular imports)
func getConfig() configInterface {
	return globalConfig
}

//
//// GetPostMaxLength returns the maximum post length from config
//func GetPostMaxLength() int {
//	return globalConfig.GetPostMaxLength()
//}
//
//// GetMaxFileSizeMB returns the maximum file size in MB from config
//func GetMaxFileSizeMB() int {
//	return globalConfig.GetMaxFileSizeMB()
//}
