package models

type User struct {
	ID          int64  `json:"id"`
	Nickname    string `json:"nickname,omitempty"`
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
	Email       string `json:"email"`
	Password    string `json:"password"`
	DateOfBirth string `json:"date_of_birth"`
	Avatar      string `json:"avatar,omitempty"`
	Bio         string `json:"bio,omitempty"`
	IsPrivate   bool   `json:"is_private"`
}
