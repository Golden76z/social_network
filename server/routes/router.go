package routes

import (
	"net/http"
	"path"
	"strings"

	"github.com/Golden76z/social-network/utils"
)

// Middleware represents a middleware function
type Middleware func(http.Handler) http.Handler

// Router represents our custom router with middleware support
type Router struct {
	middlewares []Middleware
	routes      map[string]map[string]http.HandlerFunc // method -> pattern -> handler
	prefix      string
}

// New creates a new router instance
func New() *Router {
	return &Router{
		middlewares: make([]Middleware, 0),
		routes: map[string]map[string]http.HandlerFunc{
			"GET":    make(map[string]http.HandlerFunc),
			"POST":   make(map[string]http.HandlerFunc),
			"PUT":    make(map[string]http.HandlerFunc),
			"DELETE": make(map[string]http.HandlerFunc),
			"PATCH":  make(map[string]http.HandlerFunc),
		},
	}
}

// Use adds middleware to the router
func (r *Router) Use(middleware Middleware) {
	r.middlewares = append(r.middlewares, middleware)
}

// Group creates a new route group with shared middleware
func (r *Router) Group(fn func(*Router)) {
	// Create a new router that inherits current middlewares
	subRouter := &Router{
		middlewares: make([]Middleware, len(r.middlewares)),
		routes: map[string]map[string]http.HandlerFunc{
			"GET":    make(map[string]http.HandlerFunc),
			"POST":   make(map[string]http.HandlerFunc),
			"PUT":    make(map[string]http.HandlerFunc),
			"DELETE": make(map[string]http.HandlerFunc),
			"PATCH":  make(map[string]http.HandlerFunc),
		},
		prefix: r.prefix,
	}
	copy(subRouter.middlewares, r.middlewares)

	// Execute the group function
	fn(subRouter)

	// Merge routes back to parent router
	for method, routes := range subRouter.routes {
		for pattern, handler := range routes {
			r.routes[method][pattern] = r.wrapWithMiddlewares(handler, subRouter.middlewares).(http.HandlerFunc)
		}
	}
}

// Route registration methods
func (r *Router) GET(pattern string, handler http.HandlerFunc) {
	r.addRoute("GET", pattern, handler)
}

func (r *Router) POST(pattern string, handler http.HandlerFunc) {
	r.addRoute("POST", pattern, handler)
}

func (r *Router) PUT(pattern string, handler http.HandlerFunc) {
	r.addRoute("PUT", pattern, handler)
}

func (r *Router) DELETE(pattern string, handler http.HandlerFunc) {
	r.addRoute("DELETE", pattern, handler)
}

func (r *Router) PATCH(pattern string, handler http.HandlerFunc) {
	r.addRoute("PATCH", pattern, handler)
}

func (r *Router) addRoute(method, pattern string, handler http.HandlerFunc) {
	fullPattern := path.Join(r.prefix, pattern)
	if fullPattern == "" {
		fullPattern = "/"
	}
	r.routes[method][fullPattern] = handler
}

// ServeHTTP implements http.Handler interface
func (r *Router) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	// Handle CORS preflight requests
	if req.Method == "OPTIONS" {
		// Apply middleware to OPTIONS handler
		handler := r.wrapWithMiddlewares(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
		}), r.middlewares)
		handler.ServeHTTP(w, req)
		return
	}

	// Find matching route
	if methodRoutes, exists := r.routes[req.Method]; exists {
		// First try exact match
		if handler, exists := methodRoutes[req.URL.Path]; exists {
			finalHandler := r.wrapWithMiddlewares(handler, r.middlewares)
			finalHandler.ServeHTTP(w, req)
			return
		}

		// Try pattern matching for routes with parameters
		for pattern, handler := range methodRoutes {
			if matches, params := r.matchRoute(pattern, req.URL.Path); matches {
				// Add path parameters to request context
				if len(params) > 0 {
					ctx := req.Context()
					for key, value := range params {
						ctx = utils.SetPathParam(ctx, key, value)
					}
					req = req.WithContext(ctx)
				}
				finalHandler := r.wrapWithMiddlewares(handler, r.middlewares)
				finalHandler.ServeHTTP(w, req)
				return
			}
		}
	}

	// No route found
	http.NotFound(w, req)
}

// matchRoute checks if a pattern matches a path and extracts parameters
func (r *Router) matchRoute(pattern, path string) (bool, map[string]string) {
	patternParts := strings.Split(strings.Trim(pattern, "/"), "/")
	pathParts := strings.Split(strings.Trim(path, "/"), "/")

	if len(patternParts) != len(pathParts) {
		return false, nil
	}

	params := make(map[string]string)

	for i, patternPart := range patternParts {
		if strings.HasPrefix(patternPart, "{") && strings.HasSuffix(patternPart, "}") {
			// This is a parameter
			paramName := patternPart[1 : len(patternPart)-1]
			params[paramName] = pathParts[i]
		} else if patternPart != pathParts[i] {
			// Static part doesn't match
			return false, nil
		}
	}

	return true, params
}

// wrapWithMiddlewares applies middleware to a handler
func (r *Router) wrapWithMiddlewares(handler http.HandlerFunc, middlewares []Middleware) http.Handler {
	// Apply middlewares in reverse order
	var h http.Handler = handler
	for i := len(middlewares) - 1; i >= 0; i-- {
		h = middlewares[i](h)
	}
	return h
}
