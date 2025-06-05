package utils

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt"
)

// GenerateSecureKey creates a random 256-bit key for JWT signing
func GenerateSecureKey() (string, error) {
	key := make([]byte, 32) // 256-bit key
	_, err := rand.Read(key)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(key), nil
}

// JWTGeneration creates a signed JWT token
func JWTGeneration(username string, secretKey string, w http.ResponseWriter) (string, error) {
	// Create the claims
	claims := jwt.MapClaims{
		"username": username,
		"exp":      time.Now().Add(15 * time.Minute).Unix(),
		"iat":      time.Now().Unix(), // issued at
		"iss":      "your-app-name",   // issuer
	}

	// Create and sign the token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secretKey))
	if err != nil {
		http.Error(w, "Token generation failed", http.StatusInternalServerError)
		return "", err
	}

	return tokenString, nil
}

// ValidateToken verifies a JWT token
func ValidateToken(tokenString string, secretKey string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Validate the alg is what you expect
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secretKey), nil
	})

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return claims, nil
	}
	return nil, err
}
