package theme

import "strconv"

type Field struct {
	Type        string `json:"type"`
	Label       string `json:"label"`
	Default     any    `json:"default"`
	Description string `json:"description,omitempty"`
}

type ColorScale struct {
	Label       string            `json:"label"`
	Description string            `json:"description"`
	Shades      map[string]string `json:"shades"`
}

type Schema struct {
	Name        string                `json:"name"`
	Version     int                   `json:"version"`
	Colors      map[string]Field      `json:"colors"`
	ColorScales map[string]ColorScale `json:"color_scales"`
	Radius      map[string]Field      `json:"radius"`
	Typography  map[string]Field      `json:"typography"`
	Shadow      map[string]Field      `json:"shadow"`
	Spacing     map[string]Field      `json:"spacing"`
}

type Values struct {
	Name       string            `json:"name"`
	Source     string            `json:"source"`
	Colors     map[string]string `json:"colors"`
	Radius     map[string]any    `json:"radius"`
	Typography map[string]any    `json:"typography"`
	Shadow     map[string]string `json:"shadow"`
	Spacing    map[string]any    `json:"spacing"`
}

func DefaultSchema() Schema {
	return Schema{
		Name:    "BubbleForge Professional Theme",
		Version: 1,
		Colors: map[string]Field{
			"primary": {
				Type:        "color",
				Label:       "Primary",
				Default:     "#1E6DF6",
				Description: "Main brand and action color.",
			},
			"primaryContrast": {
				Type:        "color",
				Label:       "Primary Contrast",
				Default:     "#FFFFFF",
				Description: "Text and icon color used on primary surfaces.",
			},
			"text": {
				Type:        "color",
				Label:       "Text",
				Default:     "#111827",
				Description: "Main static text color.",
			},
			"mutedText": {
				Type:        "color",
				Label:       "Muted Text",
				Default:     "#64748B",
				Description: "Secondary text, helper text, and quiet labels.",
			},
			"surface": {
				Type:        "color",
				Label:       "Surface",
				Default:     "#FFFFFF",
				Description: "Cards, inputs, modals, and raised surfaces.",
			},
			"background": {
				Type:        "color",
				Label:       "Background",
				Default:     "#F8FAFC",
				Description: "Page and section backgrounds.",
			},
			"border": {
				Type:        "color",
				Label:       "Border",
				Default:     "#E2E8F0",
				Description: "Borders, dividers, and input outlines.",
			},
			"danger": {
				Type:        "color",
				Label:       "Danger",
				Default:     "#DC2626",
				Description: "Errors, destructive actions, and delete states.",
			},
			"success": {
				Type:        "color",
				Label:       "Success",
				Default:     "#16A34A",
				Description: "Positive actions, success messages, and confirmations.",
			},
			"alert": {
				Type:        "color",
				Label:       "Alert",
				Default:     "#D97706",
				Description: "Warnings, cautions, and attention states.",
			},
		},
		ColorScales: map[string]ColorScale{
			"primary": {
				Label:       "Primary Scale",
				Description: "Blue action scale for BubbleForge default components.",
				Shades: map[string]string{
					"10": "#EFF6FF",
					"20": "#DBEAFE",
					"30": "#BFDBFE",
					"40": "#93C5FD",
					"50": "#1E6DF6",
					"60": "#2563EB",
					"70": "#1D4ED8",
					"80": "#1E40AF",
					"90": "#1E3A8A",
				},
			},
			"gray": {
				Label:       "Gray Scale",
				Description: "Neutral scale for surfaces, borders, text, and layout.",
				Shades: map[string]string{
					"10": "#F8FAFC",
					"20": "#F1F5F9",
					"30": "#E2E8F0",
					"40": "#CBD5E1",
					"50": "#94A3B8",
					"60": "#64748B",
					"70": "#334155",
					"80": "#1E293B",
					"90": "#0F172A",
				},
			},
		},
		Radius: map[string]Field{
			"sm":   {Type: "number", Label: "Small Radius", Default: 6},
			"md":   {Type: "number", Label: "Medium Radius", Default: 8},
			"lg":   {Type: "number", Label: "Large Radius", Default: 12},
			"xl":   {Type: "number", Label: "XL Radius", Default: 16},
			"pill": {Type: "number", Label: "Pill Radius", Default: 999},
		},
		Typography: map[string]Field{
			"font":          {Type: "font", Label: "Primary Font", Default: "Inter"},
			"headingWeight": {Type: "number", Label: "Heading Weight", Default: 700},
			"bodyWeight":    {Type: "number", Label: "Body Weight", Default: 400},
			"buttonWeight":  {Type: "number", Label: "Button Weight", Default: 600},
		},
		Shadow: map[string]Field{
			"sm": {Type: "shadow", Label: "Small Shadow", Default: "0 1px 2px rgba(15, 23, 42, 0.08)"},
			"md": {Type: "shadow", Label: "Medium Shadow", Default: "0 8px 24px rgba(15, 23, 42, 0.10)"},
		},
		Spacing: map[string]Field{
			"xs": {Type: "number", Label: "Extra Small Spacing", Default: 4},
			"sm": {Type: "number", Label: "Small Spacing", Default: 8},
			"md": {Type: "number", Label: "Medium Spacing", Default: 16},
			"lg": {Type: "number", Label: "Large Spacing", Default: 24},
			"xl": {Type: "number", Label: "XL Spacing", Default: 32},
		},
	}
}

func DefaultValues() Values {
	schema := DefaultSchema()
	values := Values{
		Name:       schema.Name,
		Source:     "bubbleforge_default",
		Colors:     map[string]string{},
		Radius:     map[string]any{},
		Typography: map[string]any{},
		Shadow:     map[string]string{},
		Spacing:    map[string]any{},
	}

	for key, field := range schema.Colors {
		values.Colors[key] = field.Default.(string)
	}
	for scaleKey, scale := range schema.ColorScales {
		for shade, value := range scale.Shades {
			values.Colors[scaleKey+shade] = value
		}
	}
	for key, field := range schema.Radius {
		values.Radius[key] = field.Default
	}
	for key, field := range schema.Typography {
		values.Typography[key] = field.Default
	}
	for key, field := range schema.Shadow {
		values.Shadow[key] = field.Default.(string)
	}
	for key, field := range schema.Spacing {
		values.Spacing[key] = field.Default
	}

	return values
}

func CompilerTokenMap(values Values) map[string]string {
	font, _ := values.Typography["font"].(string)
	radius, _ := values.Radius["md"].(int)

	return map[string]string{
		"PRIMARY_COLOR":    values.Colors["primary"],
		"SECONDARY_COLOR":  values.Colors["text"],
		"TEXT_COLOR":       values.Colors["primaryContrast"],
		"BACKGROUND_COLOR": values.Colors["surface"],
		"BORDER_COLOR":     values.Colors["border"],
		"DANGER_COLOR":     values.Colors["danger"],
		"SUCCESS_COLOR":    values.Colors["success"],
		"ALERT_COLOR":      values.Colors["alert"],
		"FONT_FAMILY":      font,
		"RADIUS":           strconv.Itoa(radius),
	}
}
