package middleware

import (
	"context"
	"github.com/Golden76z/social-network/utils"
	"net/http"
	//"github.com/Golden76z/social-network/utils"
)

// JWTContextKey is used to store JWT claims in context
type JWTContextKey string

const ClaimsKey JWTContextKey = "jwt_claims"

// JWTMiddleware validates JWT tokens
func JWTMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims, err := utils.TokenInformations(w, r)
		if err != nil {
			http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
			return
		}

		// Add claims to request context
		ctx := context.WithValue(r.Context(), ClaimsKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetClaimsFromContext extracts JWT claims from request context
func GetClaimsFromContext(r *http.Request) (*utils.JWTClaims, bool) {
	claims, ok := r.Context().Value(ClaimsKey).(*utils.JWTClaims)
	return claims, ok
}
