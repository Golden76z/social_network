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
	user_id, errUserID := db.DBService.GetUserIDByUsername(username)
	if errUserID != nil {
		return errUserID
	}

	fmt.Println("USERID", user_id)

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
		Secure:   false,
		SameSite: http.SameSiteStrictMode, // may affect how cookies are sent in cross-origin requests.
		Path:     "/api/",
		// 15min cookie
		MaxAge: 15 * 60,
	})

	return nil
}
