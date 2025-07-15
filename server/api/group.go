package api

import (
	"fmt"
	"net/http"

	"github.com/Golden76z/social-network/config"
	"github.com/Golden76z/social-network/utils"
)

func CreateGroupHandler(w http.ResponseWriter, r *http.Request) {
	claims, errToken := utils.TokenInformations(w, r, config.GetConfig().JWTKey)
	if errToken != nil {
		http.Error(w, "Error retrieving the token informations", http.StatusMethodNotAllowed)
		return
	}
	fmt.Println(claims)
}

func GetGroupHandler(w http.ResponseWriter, r *http.Request) {

}

func UpdateGroupHandler(w http.ResponseWriter, r *http.Request) {

}

func DeleteGroupHandler(w http.ResponseWriter, r *http.Request) {

}
