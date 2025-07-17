package utils

import (
	"database/sql"
	"fmt"
	"strings"
)

// UpdateField represents a field to be updated
type UpdateField struct {
	Column string
	Value  interface{}
}

// BuildUpdateQuery dynamically builds an UPDATE SQL query
func BuildUpdateQuery(table string, fields []UpdateField, whereClause string) (string, []interface{}) {
	if len(fields) == 0 {
		return "", nil
	}
	
	var setParts []string
	var values []interface{}
	
	for _, field := range fields {
		setParts = append(setParts, fmt.Sprintf("%s = ?", field.Column))
		values = append(values, field.Value)
	}
	
	query := fmt.Sprintf("UPDATE %s SET %s WHERE %s", 
		table, 
		strings.Join(setParts, ", "), 
		whereClause)
	
	return query, values
}

// ConvertToNullString converts a string pointer to sql.NullString
func ConvertToNullString(s *string) sql.NullString {
	if s == nil {
		return sql.NullString{Valid: false}
	}
	return sql.NullString{String: *s, Valid: true}
}

// ConvertToNullBool converts a bool pointer to sql.NullBool
func ConvertToNullBool(b *bool) sql.NullBool {
	if b == nil {
		return sql.NullBool{Valid: false}
	}
	return sql.NullBool{Bool: *b, Valid: true}
}
