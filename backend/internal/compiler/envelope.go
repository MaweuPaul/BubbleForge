package compiler

// EnsureCopyEnvelope converts a single Bubble element template into the
// clipboard shape Bubble expects: {"type":"copy","elements":[...]}.
func EnsureCopyEnvelope(jsonObj map[string]any) map[string]any {
	if _, ok := jsonObj["elements"]; ok {
		if _, hasType := jsonObj["type"]; !hasType {
			jsonObj["type"] = "copy"
		}
		return jsonObj
	}

	if _, ok := jsonObj["type"].(string); !ok {
		return jsonObj
	}

	element := jsonObj
	if _, ok := element["id"]; !ok {
		element["id"] = "{{ELEMENT_ID_0}}"
	}

	return map[string]any{
		"type":     "copy",
		"elements": []any{element},
	}
}

// EnsureButtonFixedHeight enforces Bubble's fixed-height flags for Button
// elements so compiled button presets keep their explicit numeric height.
func EnsureButtonFixedHeight(jsonObj map[string]any) map[string]any {
	enforceButtonFixedHeightValue(jsonObj)
	return jsonObj
}

func enforceButtonFixedHeightValue(v any) {
	switch val := v.(type) {
	case map[string]any:
		if val["type"] == "Button" {
			props, ok := val["properties"].(map[string]any)
			if !ok {
				props = make(map[string]any)
				val["properties"] = props
			}

			props["fit_height"] = false
			props["single_height"] = true
		}

		for _, child := range val {
			enforceButtonFixedHeightValue(child)
		}
	case []any:
		for _, child := range val {
			enforceButtonFixedHeightValue(child)
		}
	}
}
