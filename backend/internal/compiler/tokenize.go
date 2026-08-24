package compiler

import (
	"fmt"
	"sort"
	"strings"
)

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

// ── Composite tokenizer ─────────────────────────────────────────────────────

// AutoTokenizeComposite walks a Bubble copy envelope that contains a Group
// with nested child elements and replaces hardcoded visual properties with
// semantic compiler tokens scoped per child element type.
//
// Token convention:
//
//	Root Group :  {{CARD_BG}}  {{RADIUS}}  {{BORDER_COLOR}}
//	Text[0]    :  {{TITLE}}    {{TITLE_COLOR}}  {{TITLE_SIZE}}
//	Text[1]    :  {{BODY}}     {{BODY_COLOR}}   {{BODY_SIZE}}
//	Text[N]    :  {{TEXT_N}}   {{TEXT_N_COLOR}} {{TEXT_N_SIZE}}
//	Button[0]  :  {{BTN_LABEL}}  {{BTN_COLOR}}  {{BTN_RADIUS}}  {{BTN_TEXT_COLOR}}
//	Image[0]   :  {{IMG_URL}}    {{IMG_RADIUS}}
func AutoTokenizeComposite(jsonObj map[string]any) map[string]any {
	// Handle copy envelope: {"type":"copy","elements":[...]}
	if jsonObj["type"] == "copy" {
		elemList, ok := jsonObj["elements"].([]any)
		if !ok || len(elemList) == 0 {
			return jsonObj
		}
		newElems := make([]any, len(elemList))
		for i, el := range elemList {
			if elMap, ok := el.(map[string]any); ok {
				newElems[i] = tokenizeCompositeRoot(elMap)
			} else {
				newElems[i] = el
			}
		}
		out := make(map[string]any, len(jsonObj))
		for k, v := range jsonObj {
			out[k] = v
		}
		out["elements"] = newElems
		return out
	}
	// Bare element (no envelope) — treat as root directly.
	return tokenizeCompositeRoot(jsonObj)
}

// tokenizeCompositeRoot tokenizes a single root Group element and its children.
func tokenizeCompositeRoot(el map[string]any) map[string]any {
	out := make(map[string]any, len(el))
	for k, v := range el {
		out[k] = v
	}
	if props, ok := el["properties"].(map[string]any); ok {
		out["properties"] = tokenizeGroupRootProperties(props)
	}
	if childMap, ok := el["elements"].(map[string]any); ok {
		out["elements"] = tokenizeCompositeChildren(childMap)
	}
	return out
}

// tokenizeGroupRootProperties replaces visual properties on the root Group with
// card-level shared tokens.
func tokenizeGroupRootProperties(props map[string]any) map[string]any {
	out := make(map[string]any, len(props))
	for k, v := range props {
		switch k {
		case "bgcolor", "background_color", "bg_color":
			out[k] = "{{CARD_BG}}"
		case "border_roundness":
			out[k] = "{{RADIUS}}"
		case "border_color":
			out[k] = "{{BORDER_COLOR}}"
		default:
			out[k] = v
		}
	}
	return out
}

// tokenizeCompositeChildren sorts children by Bubble's order property, then
// assigns scoped tokens per element type (Text[0]=title, Text[1]=body, etc.).
func tokenizeCompositeChildren(children map[string]any) map[string]any {
	type childEntry struct {
		key   string
		child map[string]any
		order float64
	}

	var entries []childEntry
	for key, child := range children {
		childMap, ok := child.(map[string]any)
		if !ok {
			continue
		}
		order := 0.0
		if props, ok := childMap["properties"].(map[string]any); ok {
			if o, ok := props["order"].(float64); ok {
				order = o
			}
		}
		entries = append(entries, childEntry{key, childMap, order})
	}
	sort.Slice(entries, func(i, j int) bool {
		return entries[i].order < entries[j].order
	})

	out := make(map[string]any, len(children))
	textIdx, btnIdx, imgIdx := 0, 0, 0

	for _, entry := range entries {
		bubbleType, _ := entry.child["type"].(string)
		newChild := make(map[string]any, len(entry.child))
		for k, v := range entry.child {
			newChild[k] = v
		}
		if props, ok := entry.child["properties"].(map[string]any); ok {
			switch bubbleType {
			case "Text", "Link":
				newChild["properties"] = tokenizeChildTextProperties(props, textIdx)
				textIdx++
			case "Button":
				newChild["properties"] = tokenizeChildButtonProperties(props, btnIdx)
				btnIdx++
			case "Image":
				newChild["properties"] = tokenizeChildImageProperties(props, imgIdx)
				imgIdx++
			default:
				// Nested group — tokenize container-level properties.
				newChild["properties"] = tokenizeGroupRootProperties(props)
			}
		}
		out[entry.key] = newChild
	}
	return out
}

// tokenizeChildTextProperties applies scoped text tokens.
// idx=0 → TITLE/TITLE_COLOR/TITLE_SIZE, idx=1 → BODY/BODY_COLOR/BODY_SIZE, idx≥2 → TEXT_N/...
func tokenizeChildTextProperties(props map[string]any, idx int) map[string]any {
	var labelTok, colorTok, sizeTok string
	switch idx {
	case 0:
		labelTok, colorTok, sizeTok = "{{TITLE}}", "{{TITLE_COLOR}}", "{{TITLE_SIZE}}"
	case 1:
		labelTok, colorTok, sizeTok = "{{BODY}}", "{{BODY_COLOR}}", "{{BODY_SIZE}}"
	default:
		n := fmt.Sprintf("%d", idx)
		labelTok = "{{TEXT_" + n + "}}"
		colorTok = "{{TEXT_" + n + "_COLOR}}"
		sizeTok = "{{TEXT_" + n + "_SIZE}}"
	}

	out := make(map[string]any, len(props))
	for k, v := range props {
		switch k {
		case "text":
			out[k] = applyTextEntryToken(v, labelTok)
		case "font_color":
			out[k] = colorTok
		case "font_size":
			out[k] = sizeTok
		default:
			out[k] = v
		}
	}
	return out
}

// tokenizeChildButtonProperties applies scoped button tokens.
func tokenizeChildButtonProperties(props map[string]any, idx int) map[string]any {
	var labelTok, bgTok, radiusTok, fgTok string
	if idx == 0 {
		labelTok, bgTok, radiusTok, fgTok = "{{BTN_LABEL}}", "{{BTN_COLOR}}", "{{BTN_RADIUS}}", "{{BTN_TEXT_COLOR}}"
	} else {
		n := fmt.Sprintf("%d", idx)
		labelTok = "{{BTN_" + n + "_LABEL}}"
		bgTok = "{{BTN_" + n + "_COLOR}}"
		radiusTok = "{{BTN_" + n + "_RADIUS}}"
		fgTok = "{{BTN_" + n + "_TEXT_COLOR}}"
	}

	out := make(map[string]any, len(props))
	for k, v := range props {
		switch k {
		case "text":
			out[k] = applyTextEntryToken(v, labelTok)
		case "bgcolor", "background_color", "bg_color":
			out[k] = bgTok
		case "border_roundness":
			out[k] = radiusTok
		case "font_color":
			out[k] = fgTok
		default:
			out[k] = v
		}
	}
	return out
}

// tokenizeChildImageProperties applies scoped image tokens.
func tokenizeChildImageProperties(props map[string]any, idx int) map[string]any {
	var urlTok, radiusTok string
	if idx == 0 {
		urlTok, radiusTok = "{{IMG_URL}}", "{{IMG_RADIUS}}"
	} else {
		n := fmt.Sprintf("%d", idx)
		urlTok = "{{IMG_" + n + "_URL}}"
		radiusTok = "{{IMG_" + n + "_RADIUS}}"
	}

	out := make(map[string]any, len(props))
	for k, v := range props {
		switch k {
		case "src", "image", "image_url", "url", "picture":
			out[k] = applyTextEntryToken(v, urlTok)
		case "border_roundness":
			out[k] = radiusTok
		default:
			out[k] = v
		}
	}
	return out
}

// applyTextEntryToken replaces all string values inside a Bubble TextExpression
// entries map with the given token. If the value is a plain string, replaces it
// directly.
func applyTextEntryToken(v any, token string) any {
	textObj, ok := v.(map[string]any)
	if !ok {
		if _, isStr := v.(string); isStr {
			return token
		}
		return v
	}
	entries, ok := textObj["entries"].(map[string]any)
	if !ok {
		return textObj
	}
	newEntries := make(map[string]any, len(entries))
	for ek, ev := range entries {
		if _, isStr := ev.(string); isStr {
			newEntries[ek] = token
		} else {
			newEntries[ek] = ev
		}
	}
	newObj := make(map[string]any, len(textObj))
	for k, val := range textObj {
		if k == "entries" {
			newObj[k] = newEntries
		} else {
			newObj[k] = val
		}
	}
	return newObj
}

