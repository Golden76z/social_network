package tests

import (
	"database/sql"
	"testing"

	"github.com/Golden76z/social-network/db"
	_ "github.com/mattn/go-sqlite3"
)

// Helper type for testing errors
type TestError struct {
	Message string
}

func (e *TestError) Error() string {
	return e.Message
}

func TestWithTransaction(t *testing.T) {
	// Create in-memory SQLite database for testing
	dbConn, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}
	defer dbConn.Close()

	// Create test table
	_, err = dbConn.Exec(`
		CREATE TABLE IF NOT EXISTS test_table (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			value INTEGER NOT NULL
		)
	`)
	if err != nil {
		t.Fatalf("Failed to create test table: %v", err)
	}

	service := &db.Service{DB: dbConn}

	t.Run("should commit successful transaction", func(t *testing.T) {
		err := service.WithTransaction(func(tx *sql.Tx) error {
			_, err := tx.Exec("INSERT INTO test_table (name, value) VALUES (?, ?)", "test1", 100)
			return err
		})
		if err != nil {
			t.Fatalf("Transaction failed: %v", err)
		}

		// Verify data was committed
		var count int
		err = dbConn.QueryRow("SELECT COUNT(*) FROM test_table WHERE name = ?", "test1").Scan(&count)
		if err != nil {
			t.Fatalf("Failed to verify data: %v", err)
		}
		if count != 1 {
			t.Fatalf("Expected 1 record, got %d", count)
		}
	})

	t.Run("should rollback failed transaction", func(t *testing.T) {
		err := service.WithTransaction(func(tx *sql.Tx) error {
			// Insert valid data
			_, err := tx.Exec("INSERT INTO test_table (name, value) VALUES (?, ?)", "test2", 200)
			if err != nil {
				return err
			}

			// Force an error by returning an error
			return &TestError{Message: "forced error"}
		})
		if err == nil {
			t.Fatal("Expected error, got nil")
		}

		// Verify data was rolled back
		var count int
		err = dbConn.QueryRow("SELECT COUNT(*) FROM test_table WHERE name = ?", "test2").Scan(&count)
		if err != nil {
			t.Fatalf("Failed to verify rollback: %v", err)
		}
		if count != 0 {
			t.Fatalf("Expected 0 records (rolled back), got %d", count)
		}
	})
}

func TestWithTransactionResult(t *testing.T) {
	// Create in-memory SQLite database for testing
	dbConn, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}
	defer dbConn.Close()

	// Create test table
	_, err = dbConn.Exec(`
		CREATE TABLE IF NOT EXISTS test_table (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			value INTEGER NOT NULL
		)
	`)
	if err != nil {
		t.Fatalf("Failed to create test table: %v", err)
	}

	service := &db.Service{DB: dbConn}

	t.Run("should return result from successful transaction", func(t *testing.T) {
		result, err := db.WithTransactionResult(service, func(tx *sql.Tx) (int, error) {
			_, err := tx.Exec("INSERT INTO test_table (name, value) VALUES (?, ?)", "test3", 300)
			if err != nil {
				return 0, err
			}
			return 42, nil
		})
		if err != nil {
			t.Fatalf("Transaction failed: %v", err)
		}
		if result != 42 {
			t.Fatalf("Expected result 42, got %d", result)
		}

		// Verify data was committed
		var count int
		err = dbConn.QueryRow("SELECT COUNT(*) FROM test_table WHERE name = ?", "test3").Scan(&count)
		if err != nil {
			t.Fatalf("Failed to verify data: %v", err)
		}
		if count != 1 {
			t.Fatalf("Expected 1 record, got %d", count)
		}
	})

	t.Run("should return error from failed transaction", func(t *testing.T) {
		result, err := db.WithTransactionResult(service, func(tx *sql.Tx) (int, error) {
			_, err := tx.Exec("INSERT INTO test_table (name, value) VALUES (?, ?)", "test4", 400)
			if err != nil {
				return 0, err
			}
			return 0, &TestError{Message: "forced error"}
		})
		if err == nil {
			t.Fatal("Expected error, got nil")
		}
		if result != 0 {
			t.Fatalf("Expected result 0, got %d", result)
		}

		// Verify data was rolled back
		var count int
		err = dbConn.QueryRow("SELECT COUNT(*) FROM test_table WHERE name = ?", "test4").Scan(&count)
		if err != nil {
			t.Fatalf("Failed to verify rollback: %v", err)
		}
		if count != 0 {
			t.Fatalf("Expected 0 records (rolled back), got %d", count)
		}
	})
}

func TestBatchTransaction(t *testing.T) {
	// Create in-memory SQLite database for testing
	dbConn, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}
	defer dbConn.Close()

	// Create test table
	_, err = dbConn.Exec(`
		CREATE TABLE IF NOT EXISTS test_table (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			value INTEGER NOT NULL
		)
	`)
	if err != nil {
		t.Fatalf("Failed to create test table: %v", err)
	}

	service := &db.Service{DB: dbConn}

	t.Run("should execute multiple operations in single transaction", func(t *testing.T) {
		err := service.WithTransaction(func(tx *sql.Tx) error {
			// Insert multiple records
			_, err := tx.Exec("INSERT INTO test_table (name, value) VALUES (?, ?)", "batch1", 100)
			if err != nil {
				return err
			}
			_, err = tx.Exec("INSERT INTO test_table (name, value) VALUES (?, ?)", "batch2", 200)
			if err != nil {
				return err
			}
			_, err = tx.Exec("INSERT INTO test_table (name, value) VALUES (?, ?)", "batch3", 300)
			return err
		})
		if err != nil {
			t.Fatalf("Batch transaction failed: %v", err)
		}

		// Verify all data was committed
		var count int
		err = dbConn.QueryRow("SELECT COUNT(*) FROM test_table WHERE name LIKE 'batch%'").Scan(&count)
		if err != nil {
			t.Fatalf("Failed to verify batch data: %v", err)
		}
		if count != 3 {
			t.Fatalf("Expected 3 records, got %d", count)
		}
	})

	t.Run("should rollback entire batch on error", func(t *testing.T) {
		err := service.WithTransaction(func(tx *sql.Tx) error {
			// Insert some records
			_, err := tx.Exec("INSERT INTO test_table (name, value) VALUES (?, ?)", "rollback1", 400)
			if err != nil {
				return err
			}
			_, err = tx.Exec("INSERT INTO test_table (name, value) VALUES (?, ?)", "rollback2", 500)
			if err != nil {
				return err
			}

			// Force an error
			return &TestError{Message: "batch rollback error"}
		})
		if err == nil {
			t.Fatal("Expected error, got nil")
		}

		// Verify all data was rolled back
		var count int
		err = dbConn.QueryRow("SELECT COUNT(*) FROM test_table WHERE name LIKE 'rollback%'").Scan(&count)
		if err != nil {
			t.Fatalf("Failed to verify rollback: %v", err)
		}
		if count != 0 {
			t.Fatalf("Expected 0 records (rolled back), got %d", count)
		}
	})
}
