package utils

import (
	"fmt"
	"net/http"
	"time"

	"github.com/Golden76z/social-network/db"
)

// Function to store the Json Web Token in the cookie
func CookieSession(username string, w http.ResponseWriter) error {
	// Creating a Json web token for the user
	token, errToken := JWTGeneration(username, Settings.JwtKey, w)
	if errToken != nil {
		fmt.Println("Error generating JWT: ", errToken)
		return errToken
	}

	// Get user_id with the username
	user_id, errUserID := db.GetUserIDByUsername(db.DBService.DB, username)
	if errUserID != nil {
		return errUserID
	}

	// Creating the session in the database
	errDbSession := db.DBService.CreateSession(int(user_id), token, 15*time.Minute)
	if errDbSession != nil {
		return errDbSession
	}

	// Storing the JWT in the cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "jwt_token",
		Value:    token,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
		// 15min cookie
		MaxAge: 15 * 60,
	})

	return nil
}
