package auth

import (
	"strings"
	"testing"
	"time"
)

const testSecret = "01234567890123456789012345678901"

func TestTokenManagerIssueAndValidateAccessToken(t *testing.T) {
	manager := newTestTokenManager(t)
	manager.now = func() time.Time { return time.Unix(1000, 0) }

	token, err := manager.IssueAccessToken(Principal{
		UserID: "user_123",
		Email:  "paul@example.com",
		Role:   "owner",
	})
	if err != nil {
		t.Fatalf("IssueAccessToken returned error: %v", err)
	}

	principal, err := manager.ValidateAccessToken(token)
	if err != nil {
		t.Fatalf("ValidateAccessToken returned error: %v", err)
	}

	if principal.UserID != "user_123" || principal.Email != "paul@example.com" || principal.Role != "owner" {
		t.Fatalf("unexpected principal: %#v", principal)
	}
}

func TestTokenManagerRejectsTamperedToken(t *testing.T) {
	manager := newTestTokenManager(t)
	manager.now = func() time.Time { return time.Unix(1000, 0) }

	token, err := manager.IssueAccessToken(Principal{UserID: "user_123"})
	if err != nil {
		t.Fatalf("IssueAccessToken returned error: %v", err)
	}

	tampered := strings.TrimSuffix(token, token[len(token)-1:]) + "x"

	if _, err := manager.ValidateAccessToken(tampered); err != ErrInvalidToken {
		t.Fatalf("expected ErrInvalidToken, got %v", err)
	}
}

func TestTokenManagerRejectsExpiredToken(t *testing.T) {
	manager := newTestTokenManager(t)
	manager.now = func() time.Time { return time.Unix(1000, 0) }

	token, err := manager.IssueAccessToken(Principal{UserID: "user_123"})
	if err != nil {
		t.Fatalf("IssueAccessToken returned error: %v", err)
	}

	manager.now = func() time.Time { return time.Unix(2000, 0) }

	if _, err := manager.ValidateAccessToken(token); err != ErrExpiredToken {
		t.Fatalf("expected ErrExpiredToken, got %v", err)
	}
}

func TestNewTokenManagerRequiresStrongSecret(t *testing.T) {
	_, err := NewTokenManager(TokenConfig{
		Secret:   "short",
		Issuer:   "issuer",
		Audience: "audience",
		TTL:      time.Minute,
	})
	if err == nil {
		t.Fatal("expected short secret to be rejected")
	}
}

func newTestTokenManager(t *testing.T) *TokenManager {
	t.Helper()

	manager, err := NewTokenManager(TokenConfig{
		Secret:   testSecret,
		Issuer:   "bubbleforge-api",
		Audience: "bubbleforge-app",
		TTL:      15 * time.Minute,
	})
	if err != nil {
		t.Fatalf("NewTokenManager returned error: %v", err)
	}

	return manager
}
