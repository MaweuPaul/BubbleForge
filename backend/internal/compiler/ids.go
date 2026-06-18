package compiler

import (
	"crypto/rand"
	"encoding/json"
	"regexp"
	"strings"
)

const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

// GenerateElementID generates a Bubble-compatible 5-char alphanumeric ID
func GenerateElementID() string {
	b := make([]byte, 5)
	if _, err := rand.Read(b); err != nil {
		panic(err) // rand.Read should never fail
	}
	for i := range b {
		b[i] = charset[int(b[i])%len(charset)]
	}
	return string(b)
}

var idPattern = regexp.MustCompile(`\{\{ELEMENT_ID_[^}]+\}\}`)

// GenerateFreshIDs replaces all {{ELEMENT_ID_N}} tokens with fresh IDs
// using a two-pass mechanism to ensure id and current_parent match perfectly.
func GenerateFreshIDs(jsonObj map[string]any) (map[string]any, error) {
	// Serialize to string for easy global replacement
	bytes, err := json.Marshal(jsonObj)
	if err != nil {
		return nil, err
	}

	str := string(bytes)

	// Pass 1: Find all unique tokens
	matches := idPattern.FindAllString(str, -1)
	tokenMap := make(map[string]string)

	for _, match := range matches {
		if _, exists := tokenMap[match]; !exists {
			tokenMap[match] = GenerateElementID()
		}
	}

	// Pass 2: Replace them globally
	for token, freshID := range tokenMap {
		str = strings.ReplaceAll(str, token, freshID)
	}

	var out map[string]any
	if err := json.Unmarshal([]byte(str), &out); err != nil {
		return nil, err
	}

	return out, nil
}
