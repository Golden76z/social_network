package db

import (
	"database/sql"
	"fmt"
	"log"
	"strings"
)

// TransactionFunc represents a function that operates within a transaction
type TransactionFunc func(*sql.Tx) error

// WithTransaction executes a function within a database transaction
// It automatically handles rollback on error and commit on success
func (s *Service) WithTransaction(fn TransactionFunc) error {
	if s.DB == nil {
		return fmt.Errorf("database connection is nil")
	}

	tx, err := s.DB.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}

	// Defer rollback to ensure it's called if function panics
	defer func() {
		if p := recover(); p != nil {
			if rollbackErr := tx.Rollback(); rollbackErr != nil {
				log.Printf("Error rolling back transaction after panic: %v", rollbackErr)
			}
			panic(p) // Re-panic after rollback
		}
	}()

	// Execute the function
	if err := fn(tx); err != nil {
		if rollbackErr := tx.Rollback(); rollbackErr != nil {
			log.Printf("Error rolling back transaction: %v", rollbackErr)
			return fmt.Errorf("transaction failed and rollback error: %w (original error: %v)", rollbackErr, err)
		}
		return fmt.Errorf("transaction failed: %w", err)
	}

	// Commit the transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// WithTransactionResult executes a function within a transaction and returns a result
func WithTransactionResult[T any](s *Service, fn func(*sql.Tx) (T, error)) (T, error) {
	var result T

	err := s.WithTransaction(func(tx *sql.Tx) error {
		var err error
		result, err = fn(tx)
		return err
	})

	return result, err
}

// TransactionOptions contains options for transaction behavior
type TransactionOptions struct {
	IsolationLevel sql.IsolationLevel
	ReadOnly       bool
}

// WithTransactionOptions executes a function within a transaction with specific options
func (s *Service) WithTransactionOptions(fn TransactionFunc, opts TransactionOptions) error {
	if s.DB == nil {
		return fmt.Errorf("database connection is nil")
	}

	var tx *sql.Tx
	var err error

	// Begin transaction with options
	if opts.IsolationLevel != 0 || opts.ReadOnly {
		tx, err = s.DB.BeginTx(nil, &sql.TxOptions{
			Isolation: opts.IsolationLevel,
			ReadOnly:  opts.ReadOnly,
		})
	} else {
		tx, err = s.DB.Begin()
	}

	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}

	// Defer rollback to ensure it's called if function panics
	defer func() {
		if p := recover(); p != nil {
			if rollbackErr := tx.Rollback(); rollbackErr != nil {
				log.Printf("Error rolling back transaction after panic: %v", rollbackErr)
			}
			panic(p) // Re-panic after rollback
		}
	}()

	// Execute the function
	if err := fn(tx); err != nil {
		if rollbackErr := tx.Rollback(); rollbackErr != nil {
			log.Printf("Error rolling back transaction: %v", rollbackErr)
			return fmt.Errorf("transaction failed and rollback error: %w (original error: %v)", rollbackErr, err)
		}
		return fmt.Errorf("transaction failed: %w", err)
	}

	// Commit the transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// BatchTransaction executes multiple operations in a single transaction
func (s *Service) BatchTransaction(operations []TransactionFunc) error {
	return s.WithTransaction(func(tx *sql.Tx) error {
		for i, operation := range operations {
			if err := operation(tx); err != nil {
				return fmt.Errorf("operation %d failed: %w", i, err)
			}
		}
		return nil
	})
}

// RetryTransaction retries a transaction operation if it fails due to deadlock or temporary issues
func (s *Service) RetryTransaction(fn TransactionFunc, maxRetries int) error {
	var lastErr error

	for attempt := 0; attempt <= maxRetries; attempt++ {
		err := s.WithTransaction(fn)
		if err == nil {
			return nil // Success
		}

		lastErr = err

		// Check if error is retryable (deadlock, temporary failure, etc.)
		if !isRetryableError(err) {
			break
		}

		if attempt < maxRetries {
			log.Printf("Transaction attempt %d failed, retrying: %v", attempt+1, err)
		}
	}

	return fmt.Errorf("transaction failed after %d attempts: %w", maxRetries+1, lastErr)
}

// isRetryableError checks if an error is retryable
func isRetryableError(err error) bool {
	if err == nil {
		return false
	}

	errStr := err.Error()

	// Common retryable error patterns
	retryablePatterns := []string{
		"deadlock",
		"lock timeout",
		"temporary failure",
		"connection reset",
		"connection refused",
		"timeout",
	}

	for _, pattern := range retryablePatterns {
		if strings.Contains(strings.ToLower(errStr), pattern) {
			return true
		}
	}

	return false
}

// TransactionStats tracks transaction statistics
type TransactionStats struct {
	TotalTransactions      int
	SuccessfulTransactions int
	FailedTransactions     int
	RollbackCount          int
	AverageDuration        float64
}

// GetTransactionStats returns current transaction statistics
func (s *Service) GetTransactionStats() TransactionStats {
	// This would need to be implemented with proper metrics collection
	// For now, return empty stats
	return TransactionStats{}
}
