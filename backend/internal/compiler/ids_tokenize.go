package compiler

import "fmt"

// TokenizeElementIDs converts copied Bubble element IDs into compiler tokens.
// This is especially important for composite components where children live
// inside a parent Group's nested elements map and point back via current_parent.
func TokenizeElementIDs(jsonObj map[string]any) map[string]any {
	tokenizer := &elementIDTokenizer{
		tokens: make(map[string]string),
	}
	tokenizer.collect(jsonObj)
	out, ok := tokenizer.rewrite(jsonObj, "").(map[string]any)
	if !ok {
		return jsonObj
	}
	return out
}

type elementIDTokenizer struct {
	tokens map[string]string
	next   int
}

func (t *elementIDTokenizer) tokenFor(id string) string {
	if id == "" {
		return ""
	}
	if token, ok := t.tokens[id]; ok {
		return token
	}
	token := fmt.Sprintf("{{ELEMENT_ID_%d}}", t.next)
	t.next++
	t.tokens[id] = token
	return token
}

func (t *elementIDTokenizer) collect(v any) {
	switch val := v.(type) {
	case map[string]any:
		if id, ok := val["id"].(string); ok {
			t.tokenFor(id)
		}
		if parentID, ok := val["current_parent"].(string); ok {
			t.tokenFor(parentID)
		}
		for key, child := range val {
			if key == "elements" {
				if childrenByID, ok := child.(map[string]any); ok {
					for childKey, nested := range childrenByID {
						t.tokenFor(childKey)
						t.collect(nested)
					}
					continue
				}
			}
			t.collect(child)
		}
	case []any:
		for _, item := range val {
			t.collect(item)
		}
	}
}

func (t *elementIDTokenizer) rewrite(v any, parentToken string) any {
	switch val := v.(type) {
	case map[string]any:
		out := make(map[string]any, len(val))
		elementToken := parentToken
		if id, ok := val["id"].(string); ok {
			elementToken = t.tokenFor(id)
		}

		for key, child := range val {
			if key == "id" {
				if id, ok := child.(string); ok {
					out[key] = t.tokenFor(id)
					continue
				}
			}

			if key == "current_parent" {
				if parentID, ok := child.(string); ok {
					if token := t.tokenFor(parentID); token != "" {
						out[key] = token
						continue
					}
				}
			}

			if key == "elements" {
				if childrenByID, ok := child.(map[string]any); ok {
					out[key] = t.rewriteNestedElements(childrenByID, elementToken)
					continue
				}
			}

			out[key] = t.rewrite(child, elementToken)
		}
		return out
	case []any:
		out := make([]any, len(val))
		for i, item := range val {
			out[i] = t.rewrite(item, parentToken)
		}
		return out
	default:
		return val
	}
}

func (t *elementIDTokenizer) rewriteNestedElements(childrenByID map[string]any, parentToken string) map[string]any {
	out := make(map[string]any, len(childrenByID))
	for originalKey, child := range childrenByID {
		newKey := t.tokenFor(originalKey)
		if childMap, ok := child.(map[string]any); ok {
			if childID, ok := childMap["id"].(string); ok {
				newKey = t.tokenFor(childID)
			}
			rewritten := t.rewrite(childMap, parentToken)
			if rewrittenMap, ok := rewritten.(map[string]any); ok && parentToken != "" {
				rewrittenMap["current_parent"] = parentToken
				out[newKey] = rewrittenMap
				continue
			}
			out[newKey] = rewritten
			continue
		}
		out[newKey] = t.rewrite(child, parentToken)
	}
	return out
}
