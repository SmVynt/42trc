package auth

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// SessionClaims mirrors the Node payload: { email, purpose: "session" }
type SessionClaims struct {
	Email   string `json:"email"`
	Purpose string `json:"purpose"`
	jwt.RegisteredClaims
}

func secret() []byte {
	return []byte(os.Getenv("JWT_SECRET"))
}

// GenerateSessionToken signs a session JWT for the given email
func GenerateSessionToken(email string) (string, error) {
	ttl := 7 * 24 * time.Hour // default 7d, matches Node fallback

	claims := SessionClaims{
		Email:   email,
		Purpose: "session",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(ttl)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(secret())
}

// ParseSessionToken validates a token and returns its claims
func ParseSessionToken(tokenStr string) (*SessionClaims, error) {
	claims := &SessionClaims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return secret(), nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("invalid or expired token")
	}
	if claims.Purpose != "session" || claims.Email == "" {
		return nil, errors.New("invalid session token")
	}
	return claims, nil
}