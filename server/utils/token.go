package utils

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/Golden76z/social-network/db"
)

// GenerateSecureKey creates a random 256-bit key for JWT signing (same as before)
func GenerateSecureKey() (string, error) {
	key := make([]byte, 32) // 256-bit key
	_, err := rand.Read(key)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(key), nil
}

// JWTGeneration creates a signed JWT token (manual implementation)
func JWTGeneration(username string, secretKey string, w http.ResponseWriter) (string, error) {
	// 1. Getting the userID with the username
	userID, errID := db.DBService.GetUserIDByUsername(username)
	if errID != nil {
		return "", errID
	}

	// 2. Define the JWT claims (payload)
	claims := map[string]any{
		"username": username,
		"user_id":  userID,
		// 15min duration token
		"exp": time.Now().Add(15 * time.Minute).Unix(),
		"iat": time.Now().Unix(),
		"iss": "social-network",
	}

	// 3. Encode the header (always HS256 in this case)
	header := map[string]string{
		"alg": "HS256",
		"typ": "JWT",
	}

	// 4. Base64-encode header and claims
	headerJSON, err := json.Marshal(header)
	if err != nil {
		return "", err
	}
	headerB64 := base64.RawURLEncoding.EncodeToString(headerJSON)

	claimsJSON, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}
	claimsB64 := base64.RawURLEncoding.EncodeToString(claimsJSON)

	// 5. Combine header + claims with a dot (.)
	unsignedToken := headerB64 + "." + claimsB64

	// 6. Sign the token with HMAC-SHA256
	h := hmac.New(sha256.New, []byte(secretKey))
	h.Write([]byte(unsignedToken))
	signature := h.Sum(nil)
	signatureB64 := base64.RawURLEncoding.EncodeToString(signature)

	// 7. Final JWT: header.claims.signature
	token := unsignedToken + "." + signatureB64

	return token, nil
}

// ValidateToken verifies a JWT token (manual implementation)
func ValidateToken(tokenString string, secretKey string) (map[string]any, error) {
	// 1. Split the token into parts
	parts := strings.Split(tokenString, ".")
	if len(parts) != 3 {
		return nil, errors.New("invalid token format")
	}

	// 2. Recompute the signature
	h := hmac.New(sha256.New, []byte(secretKey))
	h.Write([]byte(parts[0] + "." + parts[1]))
	expectedSignature := h.Sum(nil)
	expectedSignatureB64 := base64.RawURLEncoding.EncodeToString(expectedSignature)

	// 3. Compare signatures
	if parts[2] != expectedSignatureB64 {
		return nil, errors.New("invalid signature")
	}

	// 4. Decode the claims
	claimsJSON, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, err
	}

	var claims map[string]any
	err = json.Unmarshal(claimsJSON, &claims)
	if err != nil {
		return nil, err
	}

	// 5. Check expiration
	exp, ok := claims["exp"].(float64)
	if !ok {
		return nil, errors.New("invalid exp claim")
	}

	if time.Now().Unix() > int64(exp) {
		return nil, errors.New("token expired")
	}

	return claims, nil
}

func TokenInformations(w http.ResponseWriter, r *http.Request, key string) (map[string]any, error) {
	token, err := r.Cookie("jwt_token")
	if err != nil {
		http.Error(w, "Unauthorized: Missing token", http.StatusUnauthorized)
		return nil, err
	}
	claims, errValidation := ValidateToken(token.Value, key)
	if errValidation != nil {
		fmt.Println("Error decoding token")
	}
	return claims, nil
}
