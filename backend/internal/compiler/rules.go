package compiler

// ApplyTemplateRules applies explicit template metadata rules to compiled JSON.
// Rules are intentionally small and declarative so the extension, backend, and
// future AI builder can share the same contract.
func ApplyTemplateRules(jsonObj map[string]any, rules map[string]any) map[string]any {
	if rules == nil {
		return jsonObj
	}

	layout, ok := rules["layout"].(map[string]any)
	if !ok {
		return jsonObj
	}

	if enforce, ok := layout["enforce_fixed_height"].(bool); ok && enforce {
		return EnsureButtonFixedHeight(jsonObj)
	}

	return jsonObj
}
