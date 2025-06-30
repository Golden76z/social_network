package utils

import (
	"database/sql"
	"log"
	"time"
)

// StartSessionCleanup starts a background job to clean expired sessions
func StartSessionCleanup(db *sql.DB, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	// Initial cleanup
	if err := cleanupSessions(db); err != nil {
		log.Printf("Initial session cleanup failed: %v", err)
	}

	for range ticker.C {
		if err := cleanupSessions(db); err != nil {
			log.Printf("Session cleanup failed: %v", err)
		}
	}
}

// cleanupSessions removes expired sessions from database
func cleanupSessions(db *sql.DB) error {
	result, err := db.Exec(`
		DELETE FROM sessions 
		WHERE expires_at < ?`,
		time.Now().UTC(),
	)
	if err != nil {
		return err
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected > 0 {
		log.Printf("Cleaned up %d expired sessions", rowsAffected)
	}
	return nil
}
