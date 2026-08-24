package handlers

import (
	"context"
	"encoding/json"

	"github.com/jackc/pgx/v5/pgxpool"
)

// LoadAtoms fetches all atoms from the DB and returns them as a map keyed by atom id.
func LoadAtoms(ctx context.Context, db *pgxpool.Pool) (map[string]map[string]any, error) {
	rows, err := db.Query(ctx,
		`SELECT id, name, type, bubble_property, bubble_path, description, options, default_val, min_val, max_val
		 FROM atoms ORDER BY sort_order ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	atoms := make(map[string]map[string]any)
	for rows.Next() {
		var id, name, typ string
		var bubbleProp, bubblePath, desc, defaultVal *string
		var options []byte
		var minVal, maxVal *int
		if err := rows.Scan(&id, &name, &typ, &bubbleProp, &bubblePath, &desc, &options, &defaultVal, &minVal, &maxVal); err != nil {
			continue
		}
		m := map[string]any{"label": name, "type": typ}
		if bubbleProp != nil {
			m["bubble_property"] = *bubbleProp
		}
		if bubblePath != nil {
			m["bubble_path"] = *bubblePath
		}
		if desc != nil {
			m["description"] = *desc
		}
		if defaultVal != nil {
			m["default"] = *defaultVal
		}
		if minVal != nil {
			m["min"] = *minVal
		}
		if maxVal != nil {
			m["max"] = *maxVal
		}
		if options != nil {
			var opts []string
			if json.Unmarshal(options, &opts) == nil {
				m["options"] = opts
			}
		}
		atoms[id] = m
	}
	return atoms, rows.Err()
}

// EnrichSchema merges atom metadata into the raw property_schema bytes from the DB.
// Template-level overrides take priority over atom defaults.
func EnrichSchema(schemaBytes []byte, atoms map[string]map[string]any) any {
	if schemaBytes == nil || atoms == nil {
		return nil
	}
	var schema map[string]map[string]any
	if err := json.Unmarshal(schemaBytes, &schema); err != nil {
		return nil
	}
	for key, prop := range schema {
		if atom, ok := atoms[key]; ok {
			for atomKey, atomVal := range atom {
				if _, exists := prop[atomKey]; !exists {
					prop[atomKey] = atomVal
				}
			}
			schema[key] = prop
		}
	}
	return schema
}
