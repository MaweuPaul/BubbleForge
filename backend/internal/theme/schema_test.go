package theme

import "testing"

func TestDefaultValuesIncludesProfessionalTokens(t *testing.T) {
	values := DefaultValues()

	if values.Colors["primary"] != "#1E6DF6" {
		t.Fatalf("expected primary color #1E6DF6, got %s", values.Colors["primary"])
	}
	if values.Colors["gray90"] != "#0F172A" {
		t.Fatalf("expected gray90 #0F172A, got %s", values.Colors["gray90"])
	}
	if values.Typography["font"] != "Inter" {
		t.Fatalf("expected Inter font, got %v", values.Typography["font"])
	}
	if values.Radius["pill"] != 999 {
		t.Fatalf("expected pill radius 999, got %v", values.Radius["pill"])
	}
}

func TestCompilerTokenMapUsesDefaultValues(t *testing.T) {
	tokens := CompilerTokenMap(DefaultValues())

	if tokens["PRIMARY_COLOR"] != "#1E6DF6" {
		t.Fatalf("expected PRIMARY_COLOR token from default theme, got %s", tokens["PRIMARY_COLOR"])
	}
	if tokens["TEXT_COLOR"] != "#FFFFFF" {
		t.Fatalf("expected TEXT_COLOR token from primary contrast, got %s", tokens["TEXT_COLOR"])
	}
	if tokens["FONT_FAMILY"] != "Inter" {
		t.Fatalf("expected FONT_FAMILY Inter, got %s", tokens["FONT_FAMILY"])
	}
	if tokens["RADIUS"] != "8" {
		t.Fatalf("expected RADIUS 8, got %s", tokens["RADIUS"])
	}
}
