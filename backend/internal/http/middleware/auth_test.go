package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/MaweuPaul/BubbleForge/backend/internal/auth"
	"github.com/gin-gonic/gin"
)

func TestRequireAuthAllowsValidBearerToken(t *testing.T) {
	gin.SetMode(gin.TestMode)

	manager := newTestTokenManager(t)
	token, err := manager.IssueAccessToken(auth.Principal{
		UserID: "user_123",
		Email:  "paul@example.com",
		Role:   "owner",
	})
	if err != nil {
		t.Fatalf("IssueAccessToken returned error: %v", err)
	}

	router := gin.New()
	router.GET("/protected", RequireAuth(manager), func(c *gin.Context) {
		principal, ok := auth.PrincipalFromContext(c.Request.Context())
		if !ok {
			t.Fatal("expected principal in request context")
		}

		c.JSON(http.StatusOK, gin.H{"user_id": principal.UserID})
	})

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	res := httptest.NewRecorder()

	router.ServeHTTP(res, req)

	if res.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", res.Code)
	}
}

func TestRequireAuthRejectsMissingBearerToken(t *testing.T) {
	gin.SetMode(gin.TestMode)

	manager := newTestTokenManager(t)
	router := gin.New()
	router.GET("/protected", RequireAuth(manager), func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	res := httptest.NewRecorder()

	router.ServeHTTP(res, req)

	if res.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", res.Code)
	}
}

func newTestTokenManager(t *testing.T) *auth.TokenManager {
	t.Helper()

	manager, err := auth.NewTokenManager(auth.TokenConfig{
		Secret:   "01234567890123456789012345678901",
		Issuer:   "bubbleforge-api",
		Audience: "bubbleforge-app",
		TTL:      15 * time.Minute,
	})
	if err != nil {
		t.Fatalf("NewTokenManager returned error: %v", err)
	}

	return manager
}
