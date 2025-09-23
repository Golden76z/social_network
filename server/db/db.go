package db

import (
	"database/sql"
	"os"
	"time"

	_ "github.com/joho/godotenv/autoload"
	_ "github.com/lib/pq"
)

// Global instance
var DBService *Service

type Service struct {
	DB *sql.DB
}

func InitDB() (*Service, error) {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./social_network.db"
	}

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, err
	}

	// Test the connection
	if err := db.Ping(); err != nil {
		return nil, err
	}

	// Enable foreign key constraints
	if _, err := db.Exec("PRAGMA foreign_keys = ON"); err != nil {
		return nil, err
	}

	// Configure connection pool for SQLite with better concurrency
	db.SetMaxOpenConns(10)                  // Allow more connections for better concurrency
	db.SetMaxIdleConns(5)                   // Keep some idle connections
	db.SetConnMaxLifetime(10 * time.Minute) // Longer lifetime
	db.SetConnMaxIdleTime(5 * time.Minute)  // Close idle connections

	// Configure SQLite for better concurrency and prevent locking
	if _, err := db.Exec("PRAGMA journal_mode = WAL"); err != nil {
		return nil, err
	}
	if _, err := db.Exec("PRAGMA synchronous = NORMAL"); err != nil {
		return nil, err
	}
	if _, err := db.Exec("PRAGMA cache_size = 2000"); err != nil {
		return nil, err
	}
	if _, err := db.Exec("PRAGMA temp_store = memory"); err != nil {
		return nil, err
	}
	if _, err := db.Exec("PRAGMA busy_timeout = 30000"); err != nil {
		return nil, err
	}
	if _, err := db.Exec("PRAGMA locking_mode = NORMAL"); err != nil {
		return nil, err
	}

	// Initialize the global DBService
	DBService = &Service{DB: db}

	return DBService, nil
}
