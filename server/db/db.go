package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/joho/godotenv/autoload"
	_ "github.com/lib/pq"
)

// Global instance
var DBService *Service

type Service struct {
	DB *sql.DB
}

func InitDB() (*Service, error) {
	// Load PostgreSQL connection details from .env
	pgHost := os.Getenv("DB_HOST")
	pgPort := os.Getenv("DB_PORT")
	pgUser := os.Getenv("DB_USER")
	pgPass := os.Getenv("DB_PASSWORD")
	pgDB := os.Getenv("DB_NAME")

	// Construct connection string
	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		pgHost, pgPort, pgUser, pgPass, pgDB,
	)

	// Open connection (PostgreSQL DB, change if needed)
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Verify connection
	err = db.Ping()
	if err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// Create a new Service instance
	service := &Service{DB: db}

	// Create tables
	service.CreateUserTable()

	log.Println("Database initialized successfully!")

	// Set global instance
	DBService = service

	return service, nil
}
