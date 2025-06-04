package api

import (
	"testing"
)

// More placeholder tests for the register package
func TestArrayOperations(t *testing.T) {
	arr := [3]int{10, 20, 30}
	sum := arr[0] + arr[1] + arr[2]
	expected := 60

	if sum != expected {
		t.Errorf("Array sum = %d; expected %d", sum, expected)
	}
}

func TestStringComparison(t *testing.T) {
	str1 := "test"
	str2 := "test"
	str3 := "different"

	if str1 != str2 {
		t.Error("String comparison failed: identical strings not equal")
	}

	if str1 == str3 {
		t.Error("String comparison failed: different strings are equal")
	}
}

func TestPointerBasics(t *testing.T) {
	x := 42
	ptr := &x

	if *ptr != 42 {
		t.Errorf("Pointer dereference = %d; expected 42", *ptr)
	}

	*ptr = 100
	if x != 100 {
		t.Errorf("Variable value after pointer modification = %d; expected 100", x)
	}
}

func TestStructBasics(t *testing.T) {
	type Person struct {
		Name string
		Age  int
	}

	p := Person{Name: "John", Age: 30}

	if p.Name != "John" {
		t.Errorf("Person name = %s; expected John", p.Name)
	}

	if p.Age != 30 {
		t.Errorf("Person age = %d; expected 30", p.Age)
	}
}
