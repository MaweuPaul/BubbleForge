-- Phase 1: Introduce a categories lookup table
-- This makes category mismatches (e.g. "Button" vs "Buttons") impossible at the DB level.

CREATE TABLE IF NOT EXISTS categories (
  id         TEXT PRIMARY KEY,                                   -- 'buttons', 'text', 'images'
  name       TEXT NOT NULL,                                      -- 'Buttons', 'Text', 'Images'
  sort_order INT  NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed all known categories
INSERT INTO categories (id, name, sort_order) VALUES
  ('buttons',    'Buttons',    1),
  ('text',       'Text',       2),
  ('images',     'Images',     3),
  ('cards',      'Cards',      4),
  ('containers', 'Containers', 5),
  ('inputs',     'Inputs',     6),
  ('icons',      'Icons',      7),
  ('navigation', 'Navigation', 8),
  ('tables',     'Tables',     9),
  ('other',      'Other',      99)
ON CONFLICT (id) DO UPDATE SET
  name       = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

-- Normalise existing data: lowercase category value becomes the FK id
-- component_presets already use correct 'Buttons' — map to id 'buttons'
UPDATE component_presets
SET category = LOWER(category)
WHERE category IS NOT NULL;

-- components table uses 'Button' or 'Buttons' — normalise both
UPDATE components
SET category = CASE
  WHEN LOWER(category) IN ('button', 'buttons') THEN 'buttons'
  WHEN LOWER(category) IN ('text')              THEN 'text'
  WHEN LOWER(category) IN ('image', 'images')   THEN 'images'
  WHEN LOWER(category) IN ('card', 'cards')     THEN 'cards'
  WHEN LOWER(category) IN ('container','containers') THEN 'containers'
  ELSE LOWER(category)
END
WHERE category IS NOT NULL;

-- Add FK constraints (non-destructive — uses DEFERRABLE so existing data is not rejected mid-migration)
ALTER TABLE component_presets DROP CONSTRAINT IF EXISTS fk_component_presets_category;
ALTER TABLE components DROP CONSTRAINT IF EXISTS fk_components_category;

ALTER TABLE component_presets
  ADD CONSTRAINT fk_component_presets_category
  FOREIGN KEY (category) REFERENCES categories(id)
  DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE components
  ADD CONSTRAINT fk_components_category
  FOREIGN KEY (category) REFERENCES categories(id)
  DEFERRABLE INITIALLY DEFERRED;
