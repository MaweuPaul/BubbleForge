package compiler

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

type ComponentTemplate struct {
	BaseJSON map[string]any
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

	// 1. Build token map from PropertyValues + BrandTokens
	tokenMap := make(map[string]any)
	for k, v := range input.BrandTokens {
		tokenMap[k] = v
	}
	for k, v := range input.PropertyValues {
		// Pass exact values to preserve type
		tokenMap[strings.ToUpper(k)] = v
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

	return CompileOutput{
		BubbleJSON: cloned,
		CompiledAt: time.Now(),
	}, nil
}
