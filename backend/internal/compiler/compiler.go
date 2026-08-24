package compiler

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

// tokenKey converts a property atom id (e.g. "bgcolor") into the template token
// name (e.g. "BGCOLOR") used inside {{BGCOLOR}} placeholders in base_json.
// This is the single canonical contract between atom IDs and template tokens.
func tokenKey(k string) string {
	return strings.ToUpper(k)
}

type ComponentTemplate struct {
	BaseJSON  map[string]any
	RulesJSON map[string]any
}

type CompileInput struct {
	Template       ComponentTemplate
	PropertyValues map[string]any
	BrandTokens    map[string]string // We'll just pass brand tokens as string map
}

type CompileOutput struct {
	BubbleJSON map[string]any
	CompiledAt time.Time
}

func Compile(input CompileInput) (CompileOutput, error) {
	// Deep clone the base JSON to avoid mutating the template
	bytes, err := json.Marshal(input.Template.BaseJSON)
	if err != nil {
		return CompileOutput{}, fmt.Errorf("failed to clone base json: %w", err)
	}
	var cloned map[string]any
	if err := json.Unmarshal(bytes, &cloned); err != nil {
		return CompileOutput{}, fmt.Errorf("failed to unmarshal cloned base json: %w", err)
	}

	// Some primitive templates are stored as a single Bubble element. Bubble's
	// paste clipboard expects the outer copy envelope, so normalize here.
	cloned = EnsureCopyEnvelope(cloned)

	// 1. Build token map from PropertyValues + BrandTokens
	tokenMap := make(map[string]any)
	for k, v := range input.BrandTokens {
		tokenMap[k] = v
	}
	for k, v := range input.PropertyValues {
		// tokenKey() is the canonical contract: atom id → template token
		tokenMap[tokenKey(k)] = v
	}

	// 2. Replace Tokens
	cloned = ReplaceTokens(cloned, tokenMap)

	// 3. Generate Fresh IDs (Two-pass)
	cloned, err = GenerateFreshIDs(cloned)
	if err != nil {
		return CompileOutput{}, fmt.Errorf("failed to generate fresh ids: %w", err)
	}

	// 4. Inject Conditionals (No-op in phase 3 since templates already have them)
	cloned = InjectResponsiveConditional(cloned)

	// 5. Strip unsafe fields
	cloned = StripUnsafeFields(cloned)

	// 6. Apply template rules, then keep button fixed-height as a safety net.
	cloned = ApplyTemplateRules(cloned, input.Template.RulesJSON)
	cloned = EnsureButtonFixedHeight(cloned)

	return CompileOutput{
		BubbleJSON: cloned,
		CompiledAt: time.Now(),
	}, nil
}
