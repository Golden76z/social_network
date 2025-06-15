package models

type User struct {
	ID          int64
	Nickname    string
	FirstName   string
	LastName    string
	Email       string
	Password    string
	DateOfBirth string
	Avatar      string
	Bio         string
	IsPrivate   bool
}
