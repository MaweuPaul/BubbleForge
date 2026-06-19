package compiler

import "strings"

// AutoTokenize recursively walks a Bubble JSON object and replaces hardcoded
// values with compiler tokens (e.g. "{{bgcolor}}") based on the category.
func AutoTokenize(jsonObj map[string]any, category string) map[string]any {
	catLower := strings.ToLower(category)
	return tokenizeMap(jsonObj, catLower)
}

func tokenizeMap(m map[string]any, cat string) map[string]any {
	out := make(map[string]any)
	for k, v := range m {
		if k == "properties" {
			if propsMap, ok := v.(map[string]any); ok {
				out[k] = tokenizeProperties(propsMap, cat)
				continue
			}
		}
		out[k] = tokenizeValue(v, cat)
	}
	return out
}

func tokenizeProperties(props map[string]any, cat string) map[string]any {
	out := make(map[string]any)
	for k, v := range props {
		// Generic overrides (applies to everything)
		if k == "background_color" || k == "background" || k == "color" || k == "background_color_value" || k == "bg_color" || k == "fill_color" {
			out[k] = "{{BGCOLOR}}"
		} else if k == "border_roundness" {
			out[k] = "{{RADIUS}}"
		} else if strings.Contains(cat, "button") && k == "font_color" {
			out[k] = "{{FGCOLOR}}"
		} else if strings.Contains(cat, "text") && k == "font_color" {
			out[k] = "{{FGCOLOR}}"
		} else if (strings.Contains(cat, "text") || strings.Contains(cat, "button")) && k == "text" {
			// Deep dive into text.entries
			if textObj, ok := v.(map[string]any); ok {
				if entries, ok := textObj["entries"].(map[string]any); ok {
					newEntries := make(map[string]any)
					for ek, ev := range entries {
						if _, isStr := ev.(string); isStr {
							newEntries[ek] = "{{LABEL}}"
						} else {
							newEntries[ek] = ev
						}
					}
					newTextObj := make(map[string]any)
					for tk, tv := range textObj {
						if tk == "entries" {
							newTextObj[tk] = newEntries
						} else {
							newTextObj[tk] = tv
						}
					}
					out[k] = newTextObj
					continue
				}
			}
			// Just in case it's a direct string
			if _, ok := v.(string); ok {
				out[k] = "{{LABEL}}"
				continue
			}
			out[k] = v
		} else if strings.Contains(cat, "image") && (k == "image" || k == "url" || k == "picture") {
			out[k] = "{{IMAGE_URL}}"
		} else {
			out[k] = tokenizeValue(v, cat)
		}
	}
	return out
}

func tokenizeList(l []any, cat string) []any {
	out := make([]any, len(l))
	for i, v := range l {
		out[i] = tokenizeValue(v, cat)
	}
	return out
}

func tokenizeValue(v any, cat string) any {
	switch val := v.(type) {
	case map[string]any:
		return tokenizeMap(val, cat)
	case []any:
		return tokenizeList(val, cat)
	default:
		return val
	}
}
