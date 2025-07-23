package utils

import (
	"fmt"
	"reflect"
)

// ValidationError represents a field validation error
type ValidationError struct {
	Field   string
	Message string
}

// ValidateStringLength checks if string fields in a struct meet length requirements
func ValidateStringLength(data interface{}, minLen, maxLen int) []ValidationError {
	var errors []ValidationError
	val := reflect.ValueOf(data).Elem()
	typ := val.Type()

	for i := 0; i < val.NumField(); i++ {
		field := val.Field(i)
		fieldType := typ.Field(i)

		// Skip non-string fields
		if field.Kind() != reflect.String {
			continue
		}

		value := field.String()
		length := len(value)

		// Check if field should be validated (you could add a struct tag to opt-out)
		if fieldType.Tag.Get("validate") == "omit" {
			continue
		}

		switch {
		case length < minLen:
			errors = append(errors, ValidationError{
				Field:   fieldType.Name,
				Message: fmt.Sprintf("must be at least %d characters", minLen),
			})
		case length > maxLen:
			errors = append(errors, ValidationError{
				Field:   fieldType.Name,
				Message: fmt.Sprintf("must be at most %d characters", maxLen),
			})
		}
	}

	return errors
}
