package auth

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"
)

var (
	ErrInvalidToken = errors.New("invalid token")
	ErrExpiredToken = errors.New("token expired")
)

type Principal struct {
	UserID string
	Email  string
	Role   string
}

type TokenManager struct {
	secret   []byte
	issuer   string
	audience string
	ttl      time.Duration
	now      func() time.Time
}

type TokenConfig struct {
	Secret   string
	Issuer   string
	Audience string
	TTL      time.Duration
}

type accessTokenClaims struct {
	Subject   string `json:"sub"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	Issuer    string `json:"iss"`
	Audience  string `json:"aud"`
	IssuedAt  int64  `json:"iat"`
	NotBefore int64  `json:"nbf"`
	ExpiresAt int64  `json:"exp"`
	JWTID     string `json:"jti"`
}

type tokenHeader struct {
	Algorithm string `json:"alg"`
	Type      string `json:"typ"`
}

func NewTokenManager(cfg TokenConfig) (*TokenManager, error) {
	if len(cfg.Secret) < 32 {
		return nil, errors.New("JWT secret must be at least 32 characters")
	}

	if cfg.TTL <= 0 {
		return nil, errors.New("token TTL must be positive")
	}

	return &TokenManager{
		secret:   []byte(cfg.Secret),
		issuer:   cfg.Issuer,
		audience: cfg.Audience,
		ttl:      cfg.TTL,
		now:      time.Now,
	}, nil
}

func (m *TokenManager) IssueAccessToken(principal Principal) (string, error) {
	if principal.UserID == "" {
		return "", errors.New("principal user ID is required")
	}

	now := m.now().UTC()
	jti, err := randomID()
	if err != nil {
		return "", err
	}

	header := tokenHeader{
		Algorithm: "HS256",
		Type:      "JWT",
	}
	claims := accessTokenClaims{
		Subject:   principal.UserID,
		Email:     principal.Email,
		Role:      principal.Role,
		Issuer:    m.issuer,
		Audience:  m.audience,
		IssuedAt:  now.Unix(),
		NotBefore: now.Unix(),
		ExpiresAt: now.Add(m.ttl).Unix(),
		JWTID:     jti,
	}

	unsigned, err := encodeJWTParts(header, claims)
	if err != nil {
		return "", err
	}

	return unsigned + "." + sign(unsigned, m.secret), nil
}

func (m *TokenManager) ValidateAccessToken(token string) (Principal, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return Principal{}, ErrInvalidToken
	}

	unsigned := parts[0] + "." + parts[1]
	expectedSignature := sign(unsigned, m.secret)
	if !hmac.Equal([]byte(expectedSignature), []byte(parts[2])) {
		return Principal{}, ErrInvalidToken
	}

	var header tokenHeader
	if err := decodePart(parts[0], &header); err != nil {
		return Principal{}, ErrInvalidToken
	}

	if header.Algorithm != "HS256" || header.Type != "JWT" {
		return Principal{}, ErrInvalidToken
	}

	var claims accessTokenClaims
	if err := decodePart(parts[1], &claims); err != nil {
		return Principal{}, ErrInvalidToken
	}

	now := m.now().UTC().Unix()
	if claims.ExpiresAt <= now {
		return Principal{}, ErrExpiredToken
	}

	if claims.NotBefore > now {
		return Principal{}, ErrInvalidToken
	}

	if claims.Subject == "" || claims.JWTID == "" {
		return Principal{}, ErrInvalidToken
	}

	if claims.Issuer != m.issuer || claims.Audience != m.audience {
		return Principal{}, ErrInvalidToken
	}

	return Principal{
		UserID: claims.Subject,
		Email:  claims.Email,
		Role:   claims.Role,
	}, nil
}

func encodeJWTParts(header tokenHeader, claims accessTokenClaims) (string, error) {
	headerJSON, err := json.Marshal(header)
	if err != nil {
		return "", err
	}

	claimsJSON, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}

	return base64.RawURLEncoding.EncodeToString(headerJSON) + "." +
		base64.RawURLEncoding.EncodeToString(claimsJSON), nil
}

func decodePart(part string, target any) error {
	payload, err := base64.RawURLEncoding.DecodeString(part)
	if err != nil {
		return err
	}

	return json.Unmarshal(payload, target)
}

func sign(unsigned string, secret []byte) string {
	mac := hmac.New(sha256.New, secret)
	mac.Write([]byte(unsigned))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

func randomID() (string, error) {
	var bytes [16]byte
	if _, err := rand.Read(bytes[:]); err != nil {
		return "", fmt.Errorf("generate token ID: %w", err)
	}

	return hex.EncodeToString(bytes[:]), nil
}
