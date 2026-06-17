package middleware

import (
	"net/http"
	"strings"

	"github.com/MaweuPaul/BubbleForge/backend/internal/auth"
	"github.com/gin-gonic/gin"
)

func RequireAuth(tokens *auth.TokenManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" {
			abortUnauthorized(c)
			return
		}

		scheme, token, ok := strings.Cut(header, " ")
		if !ok || !strings.EqualFold(scheme, "Bearer") || strings.TrimSpace(token) == "" {
			abortUnauthorized(c)
			return
		}

		principal, err := tokens.ValidateAccessToken(strings.TrimSpace(token))
		if err != nil {
			abortUnauthorized(c)
			return
		}

		c.Request = c.Request.WithContext(auth.WithPrincipal(c.Request.Context(), principal))
		c.Set("principal", principal)
		c.Next()
	}
}

func abortUnauthorized(c *gin.Context) {
	c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
		"error": "unauthorized",
	})
}
