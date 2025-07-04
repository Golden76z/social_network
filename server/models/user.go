package models

// Struct POST - User creation
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

// Struct GET - User information retrieving (Profile page)
type UserProfileResponse struct {
	ID          int64  `json:"id"`
	Nickname    string `json:"nickname,omitempty"`
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
	Email       string `json:"email"`
	DateOfBirth string `json:"date_of_birth"`
	Avatar      string `json:"avatar,omitempty"`
	Bio         string `json:"bio,omitempty"`
	IsPrivate   bool   `json:"is_private"`
}

// Struct PUT - User Profile information Update
type UpdateUserProfileRequest struct {
	Nickname    *string `json:"nickname,omitempty"`
	FirstName   *string `json:"first_name,omitempty"`
	LastName    *string `json:"last_name,omitempty"`
	Email       *string `json:"email,omitempty"`
	DateOfBirth *string `json:"date_of_birth,omitempty"`
	Avatar      *string `json:"avatar,omitempty"`
	Bio         *string `json:"bio,omitempty"`
	IsPrivate   *bool   `json:"is_private,omitempty"`
}
