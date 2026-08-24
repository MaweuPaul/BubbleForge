-- Phase 3: Consolidate the two parallel component systems.
-- Migrates element_definitions + component_presets into component_templates + components.
-- After this migration, element_definitions and component_presets are dropped.

-- Step 1: Create the consolidated master button template from element_definitions.
-- Includes the responsive mobile state block (Q1 = yes).
INSERT INTO component_templates (id, component_type_id, name, slug, base_json, property_schema, status)
SELECT
  'tmpl_master_button_v2',
  'type_button',
  'Master Button (v2)',
  'master-button-v2',
  base_json,
  property_schema,
  'published'
FROM element_definitions
WHERE id = 'element_button'
ON CONFLICT (slug) DO UPDATE SET
  base_json       = EXCLUDED.base_json,
  property_schema = EXCLUDED.property_schema,
  status          = EXCLUDED.status,
  updated_at      = CURRENT_TIMESTAMP;

-- Step 2: Migrate all component_presets into the components table.
-- The property_values keys already match the compiler's token convention (e.g. bgcolor → {{BGCOLOR}}).
INSERT INTO components (id, category, name, description, access, template_id, property_values, created_at)
SELECT
  p.id,
  'buttons',                   -- normalised FK to categories table
  p.name,
  p.description,
  p.access,
  'tmpl_master_button_v2',
  p.property_values,
  p.created_at
FROM component_presets p
WHERE p.status = 'published'
ON CONFLICT (id) DO UPDATE SET
  name            = EXCLUDED.name,
  description     = EXCLUDED.description,
  template_id     = EXCLUDED.template_id,
  property_values = EXCLUDED.property_values;

-- Step 3: Drop the old FK constraint added in 005 before dropping the table.
ALTER TABLE component_presets DROP CONSTRAINT IF EXISTS fk_component_presets_category;

-- Step 4: Drop the legacy tables.
DROP TABLE IF EXISTS component_presets;
DROP TABLE IF EXISTS element_definitions;

-- Step 5: Remove the old List filter guard (done in Go code, not SQL).
-- The 'comp-button-%' exclusion filter in the List handler is removed in the handler update.
