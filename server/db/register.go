package db

import (
	"net/http"
)

func (s *Service) CreateUserTable() {
	// User table creation
}

func (s *Service) RegisterDB(username, email, password string, w http.ResponseWriter) error {
	// DB interaction for register
	return nil
}
