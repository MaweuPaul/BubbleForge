package compiler

import "testing"

func TestTokenizeElementIDsHandlesNestedGroupChildren(t *testing.T) {
	out := TokenizeElementIDs(map[string]any{
		"type": "copy",
		"elements": []any{
			map[string]any{
				"id":   "group_old",
				"type": "Group",
				"elements": map[string]any{
					"child_map_key": map[string]any{
						"id":             "button_old",
						"type":           "Button",
						"current_parent": "page_old",
					},
				},
			},
		},
	})

	elements := out["elements"].([]any)
	group := elements[0].(map[string]any)
	groupID := group["id"].(string)
	children := group["elements"].(map[string]any)

	var child map[string]any
	var childKey string
	for key, rawChild := range children {
		childKey = key
		child = rawChild.(map[string]any)
	}
	if child == nil {
		t.Fatalf("expected one nested child, got %#v", children)
	}
	if child["id"] != childKey {
		t.Fatalf("expected child id token, got %#v", child["id"])
	}
	if child["current_parent"] != groupID {
		t.Fatalf("expected nested child current_parent to be group token %s, got %#v", groupID, child["current_parent"])
	}
}

func TestCompileRegeneratesNestedGroupIDs(t *testing.T) {
	tokenized := TokenizeElementIDs(map[string]any{
		"type": "copy",
		"elements": []any{
			map[string]any{
				"id":   "group_old",
				"type": "Group",
				"elements": map[string]any{
					"button_old": map[string]any{
						"id":             "button_old",
						"type":           "Button",
						"current_parent": "group_old",
						"properties": map[string]any{
							"height":        40,
							"fit_height":    true,
							"single_height": false,
						},
					},
				},
			},
		},
	})

	out, err := Compile(CompileInput{
		Template:       ComponentTemplate{BaseJSON: tokenized},
		PropertyValues: map[string]any{},
		BrandTokens:    map[string]string{},
	})
	if err != nil {
		t.Fatalf("compile failed: %v", err)
	}

	elements := out.BubbleJSON["elements"].([]any)
	group := elements[0].(map[string]any)
	groupID := group["id"].(string)
	children := group["elements"].(map[string]any)

	var child map[string]any
	for key, rawChild := range children {
		child = rawChild.(map[string]any)
		if key != child["id"] {
			t.Fatalf("expected nested key to match child id, key=%s id=%#v", key, child["id"])
		}
	}
	if child["current_parent"] != groupID {
		t.Fatalf("expected child current_parent %s, got %#v", groupID, child["current_parent"])
	}
}

func TestCompileRegeneratesDeeplyNestedGroupTreeIDs(t *testing.T) {
	tokenized := TokenizeElementIDs(map[string]any{
		"type": "copy",
		"elements": []any{
			map[string]any{
				"id":   "outer_group",
				"type": "Group",
				"elements": map[string]any{
					"inner_group_key": map[string]any{
						"id":             "inner_group",
						"type":           "Group",
						"current_parent": "outer_group",
						"elements": map[string]any{
							"button_key": map[string]any{
								"id":             "button_deep",
								"type":           "Button",
								"current_parent": "inner_group",
								"properties": map[string]any{
									"height":        40,
									"fit_height":    true,
									"single_height": false,
								},
							},
						},
					},
				},
			},
		},
	})

	out, err := Compile(CompileInput{
		Template:       ComponentTemplate{BaseJSON: tokenized},
		PropertyValues: map[string]any{},
		BrandTokens:    map[string]string{},
	})
	if err != nil {
		t.Fatalf("compile failed: %v", err)
	}

	outer := out.BubbleJSON["elements"].([]any)[0].(map[string]any)
	outerID := outer["id"].(string)
	outerChildren := outer["elements"].(map[string]any)

	var inner map[string]any
	var innerKey string
	for key, rawChild := range outerChildren {
		innerKey = key
		inner = rawChild.(map[string]any)
	}
	if inner == nil {
		t.Fatalf("expected inner group")
	}
	if innerKey != inner["id"] {
		t.Fatalf("expected inner key to match id, key=%s id=%#v", innerKey, inner["id"])
	}
	if inner["current_parent"] != outerID {
		t.Fatalf("expected inner parent %s, got %#v", outerID, inner["current_parent"])
	}

	innerID := inner["id"].(string)
	innerChildren := inner["elements"].(map[string]any)
	var button map[string]any
	var buttonKey string
	for key, rawChild := range innerChildren {
		buttonKey = key
		button = rawChild.(map[string]any)
	}
	if button == nil {
		t.Fatalf("expected deep button")
	}
	if buttonKey != button["id"] {
		t.Fatalf("expected button key to match id, key=%s id=%#v", buttonKey, button["id"])
	}
	if button["current_parent"] != innerID {
		t.Fatalf("expected button parent %s, got %#v", innerID, button["current_parent"])
	}

	props := button["properties"].(map[string]any)
	if props["fit_height"] != false || props["single_height"] != true {
		t.Fatalf("expected deep button fixed height, got fit_height=%#v single_height=%#v", props["fit_height"], props["single_height"])
	}
}
