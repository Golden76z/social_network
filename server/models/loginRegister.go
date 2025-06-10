package models

type LoginRequest struct {
	Username string `json:"loginEmail"`
	Password string `json:"loginPassword"`
}

type RegisterRequest struct {
	Username string `json:"fullName"`
	Email    string `json:"registerEmail"`
	Password string `json:"registerPassword"`
}
