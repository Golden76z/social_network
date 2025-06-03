package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt"
)

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 1. Extract JWT
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"error": "Authorization header required"}`))
			return
		}

		// 2. Parse and validate JWT
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte("your-secret-key"), nil
		})
		if err != nil || !token.Valid {
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"error": "Invalid token"}`))
			return
		}

		// 3. Check expiration (backend validates this!)
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok || !claims.VerifyExpiresAt(time.Now().Unix(), true) {
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"error": "Token expired"}`))
			return
		}

		// 4. Optional: Validate custom claims (e.g., user role)
		if claims["role"] != "admin" {
			w.WriteHeader(http.StatusForbidden)
			return
		}

		// 5. Store token in context for resolvers
		ctx := context.WithValue(r.Context(), "token", token)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
