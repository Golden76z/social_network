package utils

import (
	"fmt"
	"net/http"
)

// Function to store the Json Web Token in the cookie
func CookieSession(username string, w http.ResponseWriter) error {
	// Creating a Json web token for the user
	token, errToken := JWTGeneration(username, Settings.JwtKey, w)
	if errToken != nil {
		fmt.Println("Error generating JWT: ", errToken)
		return errToken
	}

	fmt.Println("test cookie 1")
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
	fmt.Println("test cookie 2")

	return nil
}
