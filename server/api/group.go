package api

import (
	"fmt"
	"net/http"

	"github.com/Golden76z/social-network/config"
	"github.com/Golden76z/social-network/utils"
)

func CreateGroupHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("test")
	token, err := r.Cookie("jwt_token")
	if err != nil {
		http.Error(w, "Unauthorized: Missing token", http.StatusUnauthorized)
		return
	}
	key := config.Config.JWTKey
	claims, errValidation := utils.ValidateToken(token.Value, key)
	if errValidation != nil {
		fmt.Println("Error decoding token")
	}
	fmt.Println(claims)
}

func GetGroupHandler(w http.ResponseWriter, r *http.Request) {

}

func UpdateGroupHandler(w http.ResponseWriter, r *http.Request) {

}

func DeleteGroupHandler(w http.ResponseWriter, r *http.Request) {

}
