package utils

import (
	"context"
	"net/http"
)

// Context key for path parameters
type contextKey string

const pathParamsKey contextKey = "pathParams"

func SetPathParam(ctx context.Context, key, value string) context.Context {
	params, _ := ctx.Value(pathParamsKey).(map[string]string)
	if params == nil {
		params = make(map[string]string)
	}
	params[key] = value
	return context.WithValue(ctx, pathParamsKey, params)
}

// GetPathParam retrieves a path parameter from the request context
func GetPathParam(req *http.Request, key string) string {
	if params, ok := req.Context().Value(pathParamsKey).(map[string]string); ok {
		return params[key]
	}
	return ""
}
