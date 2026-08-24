package compiler

import "testing"

func TestCompileWrapsSingleElementInCopyEnvelope(t *testing.T) {
	out, err := Compile(CompileInput{
		Template: ComponentTemplate{
			BaseJSON: map[string]any{
				"type":         "Text",
				"default_name": "BF: Text",
				"properties": map[string]any{
					"text": "{{TEXT}}",
				},
			},
		},
		PropertyValues: map[string]any{"text": "Hello"},
		BrandTokens:    map[string]string{},
	})
	if err != nil {
		t.Fatalf("compile failed: %v", err)
	}

	if out.BubbleJSON["type"] != "copy" {
		t.Fatalf("expected copy envelope, got %v", out.BubbleJSON["type"])
	}
	elements, ok := out.BubbleJSON["elements"].([]any)
	if !ok || len(elements) != 1 {
		t.Fatalf("expected one element, got %#v", out.BubbleJSON["elements"])
	}
	element, ok := elements[0].(map[string]any)
	if !ok {
		t.Fatalf("expected element map, got %#v", elements[0])
	}
	if element["id"] == "" {
		t.Fatalf("expected generated element id")
	}
}

func TestCompileForcesButtonsToFixedHeight(t *testing.T) {
	out, err := Compile(CompileInput{
		Template: ComponentTemplate{
			BaseJSON: map[string]any{
				"type": "copy",
				"elements": []any{
					map[string]any{
						"id":   "button_0",
						"type": "Button",
						"properties": map[string]any{
							"height":        44,
							"fit_height":    true,
							"single_height": false,
						},
					},
				},
			},
		},
		PropertyValues: map[string]any{},
		BrandTokens:    map[string]string{},
	})
	if err != nil {
		t.Fatalf("compile failed: %v", err)
	}

	elements := out.BubbleJSON["elements"].([]any)
	button := elements[0].(map[string]any)
	props := button["properties"].(map[string]any)

	if props["fit_height"] != false {
		t.Fatalf("expected fit_height false, got %#v", props["fit_height"])
	}
	if props["single_height"] != true {
		t.Fatalf("expected single_height true, got %#v", props["single_height"])
	}
	if props["height"] != float64(44) {
		t.Fatalf("expected height to be preserved, got %#v", props["height"])
	}
}

func TestCompileAppliesFixedHeightRule(t *testing.T) {
	out, err := Compile(CompileInput{
		Template: ComponentTemplate{
			BaseJSON: map[string]any{
				"type": "copy",
				"elements": []any{
					map[string]any{
						"id":   "button_0",
						"type": "Button",
						"properties": map[string]any{
							"height":        48,
							"fit_height":    true,
							"single_height": false,
						},
					},
				},
			},
			RulesJSON: map[string]any{
				"layout": map[string]any{
					"enforce_fixed_height": true,
				},
			},
		},
		PropertyValues: map[string]any{},
		BrandTokens:    map[string]string{},
	})
	if err != nil {
		t.Fatalf("compile failed: %v", err)
	}

	elements := out.BubbleJSON["elements"].([]any)
	button := elements[0].(map[string]any)
	props := button["properties"].(map[string]any)

	if props["fit_height"] != false || props["single_height"] != true {
		t.Fatalf("expected fixed-height rule to apply, got fit_height=%#v single_height=%#v", props["fit_height"], props["single_height"])
	}
}
