package models

import "database/sql"

// Struct POST - User creation
type User struct {
	ID          int64          `json:"id"`
	Nickname    string         `json:"nickname,omitempty"`
	FirstName   string         `json:"first_name"`
	LastName    string         `json:"last_name"`
	Email       string         `json:"email"`
	Password    string         `json:"password"`
	DateOfBirth string         `json:"date_of_birth"`
	Avatar      sql.NullString `json:"avatar,omitempty"`
	Bio         sql.NullString `json:"bio,omitempty"`
	IsPrivate   bool           `json:"is_private"`
	CreatedAt   string         `json:"created_at"`
	Followers   int            `json:"followers"`
	Followed    int            `json:"followed"`
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
	CreatedAt   string `json:"created_at"`
	Followers   int    `json:"followers"`
	Followed    int    `json:"followed"`
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

// Struct for update response with updated fields
type UpdateProfileResponse struct {
	Message       string                 `json:"message"`
	UpdatedFields map[string]interface{} `json:"updated_fields"`
}

// Helper methods to convert sql.NullString to string
//func (u *User) GetNickname() string {
//	if u.Nickname.Valid {
//		return u.Nickname.String
//	}
//	return ""
//}

func (u *User) GetAvatar() string {
	if u.Avatar.Valid {
		return u.Avatar.String
	}
	return ""
}

func (u *User) GetBio() string {
	if u.Bio.Valid {
		return u.Bio.String
	}
	return ""
}
