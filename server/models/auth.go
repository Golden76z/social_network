package models

type LoginRequest struct {
	Username string `json:"email"`
	Password string `json:"password"`
}

type RegisterRequest struct {
	Nickname    string `json:"nickname"`
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
	Email       string `json:"email"`
	Password    string `json:"password"`
	DateOfBirth string `json:"date_of_birth"`
	Bio         string `json:"bio,omitempty"`
}
