package auth

import "testing"

func TestHashPasswordAndVerifyPassword(t *testing.T) {
	hash, err := HashPassword("correct-horse-battery-staple")
	if err != nil {
		t.Fatalf("HashPassword returned error: %v", err)
	}

	if hash == "correct-horse-battery-staple" {
		t.Fatal("password hash must not equal plaintext password")
	}

	if !VerifyPassword(hash, "correct-horse-battery-staple") {
		t.Fatal("expected password verification to succeed")
	}

	if VerifyPassword(hash, "wrong-password") {
		t.Fatal("expected password verification to fail")
	}
}
