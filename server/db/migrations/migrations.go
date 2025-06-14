package migrations

import (
	"fmt"
	"log"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/sqlite"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func RunMigrations(dbPath string, migrationsDir string) error {
	migrationsURL := fmt.Sprintf("file://%s", migrationsDir)
	dbURL := fmt.Sprintf("sqlite://%s", dbPath)

	m, err := migrate.New(migrationsURL, dbURL)
	if err != nil {
		return fmt.Errorf("failed to create migrate instance: %w", err)
	}
	defer m.Close()

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("migration failed: %w", err)
	}
	log.Println("Database migrated successfully")
	return nil
}
