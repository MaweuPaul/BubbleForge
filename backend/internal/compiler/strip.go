package compiler

// StripUnsafeFields recursively removes fields that could break the Bubble editor.
func StripUnsafeFields(jsonObj map[string]any) map[string]any {
	return stripMap(jsonObj)
}

func stripMap(m map[string]any) map[string]any {
	out := make(map[string]any)
	for k, v := range m {
		if k == "said" {
			continue // Unsafe Bubble signature ID
		}
		out[k] = stripValue(v)
	}
	return out
}

func stripList(l []any) []any {
	out := make([]any, len(l))
	for i, v := range l {
		out[i] = stripValue(v)
	}
	return out
}

func stripValue(v any) any {
	switch val := v.(type) {
	case map[string]any:
		return stripMap(val)
	case []any:
		return stripList(val)
	default:
		return val
	}
}
