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
		if token, ok := genericPropertyToken(k); ok {
			out[k] = token
			continue
		}

		// Category: Button
		if strings.Contains(cat, "button") {
			if k == "background_color" || k == "bg_color" || k == "bgcolor" {
				out[k] = "{{BGCOLOR}}"
				continue
			} else if k == "border_roundness" {
				out[k] = "{{RADIUS}}"
				continue
			} else if k == "border_color" {
				out[k] = "{{BORDER_COLOR}}"
				continue
			} else if k == "font_color" {
				out[k] = "{{FGCOLOR}}"
				continue
			} else if k == "text" {
				out[k] = tokenizeTextContent(v)
				continue
			}
		}

		// Category: Text
		if strings.Contains(cat, "text") || strings.Contains(cat, "typography") {
			if k == "font_color" || k == "color" {
				out[k] = "{{FGCOLOR}}"
				continue
			} else if k == "text_align" || k == "text_alignment" || k == "alignment" {
				out[k] = "{{ALIGN}}"
				continue
			} else if k == "text" {
				out[k] = tokenizeTextContent(v)
				continue
			}
		}

		// Category: Image
		if strings.Contains(cat, "image") || strings.Contains(cat, "media") {
			if k == "image" || k == "url" || k == "picture" || k == "image_url" {
				out[k] = "{{IMAGE_URL}}"
				continue
			} else if k == "border_roundness" {
				out[k] = "{{RADIUS}}"
				continue
			} else if k == "alt" || k == "alt_text" {
				out[k] = "{{ALT}}"
				continue
			} else if k == "object_fit" || k == "fit" {
				out[k] = "{{FIT}}"
				continue
			}
		}

		// Category: Container / Card
		if strings.Contains(cat, "container") || strings.Contains(cat, "card") {
			if k == "background_color" || k == "bg_color" || k == "bgcolor" {
				out[k] = "{{BGCOLOR}}"
				continue
			} else if k == "border_roundness" {
				out[k] = "{{RADIUS}}"
				continue
			} else if k == "border_color" {
				out[k] = "{{BORDER_COLOR}}"
				continue
			}
		}

		// Fallback for everything else
		out[k] = tokenizeValue(v, cat)
	}
	return out
}

func genericPropertyToken(k string) (string, bool) {
	switch k {
	case "font_size":
		return "{{FONT_SIZE}}", true
	case "font_weight", "font_weight_css":
		return "{{FONT_WEIGHT}}", true
	case "font_bold":
		return "{{FONT_BOLD}}", true
	case "padding", "padding_top", "padding_right", "padding_bottom", "padding_left":
		return "{{PADDING}}", true
	case "width":
		return "{{WIDTH}}", true
	case "height":
		return "{{HEIGHT}}", true
	case "min_width_css":
		return "{{MIN_WIDTH_CSS}}", true
	case "min_height_css":
		return "{{MIN_HEIGHT_CSS}}", true
	default:
		return "", false
	}
}

func tokenizeTextContent(v any) any {
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
			return newTextObj
		}
	}
	if _, ok := v.(string); ok {
		return "{{LABEL}}"
	}
	return v
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
