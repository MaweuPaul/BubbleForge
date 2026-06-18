package compiler

import (
	"fmt"
	"strings"
)

// ReplaceTokens recursively walks the JSON and replaces all {{TOKEN}} keys
// with values from the provided tokenMap.
func ReplaceTokens(jsonObj map[string]any, tokenMap map[string]any) map[string]any {
	return replaceInMap(jsonObj, tokenMap)
}

func replaceInMap(m map[string]any, tokens map[string]any) map[string]any {
	out := make(map[string]any)
	for k, v := range m {
		out[k] = replaceValue(v, tokens)
	}
	return out
}

func replaceInList(l []any, tokens map[string]any) []any {
	out := make([]any, len(l))
	for i, v := range l {
		out[i] = replaceValue(v, tokens)
	}
	return out
}

func replaceValue(v any, tokens map[string]any) any {
	switch val := v.(type) {
	case map[string]any:
		return replaceInMap(val, tokens)
	case []any:
		return replaceInList(val, tokens)
	case string:
		return replaceString(val, tokens)
	default:
		return val
	}
}

func replaceString(s string, tokens map[string]any) any {
	// If the string is EXACTLY the token, return the raw value to preserve type
	for k, v := range tokens {
		token := "{{" + k + "}}"
		if s == token {
			return v
		}
	}

	// Otherwise, it's a string substitution
	for k, v := range tokens {
		token := "{{" + k + "}}"
		strVal := fmt.Sprintf("%v", v)
		s = strings.ReplaceAll(s, token, strVal)
	}
	return s
}
