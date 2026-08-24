INSERT INTO atoms (id, name, type, bubble_property, bubble_path, description, options, default_val, min_val, max_val, sort_order) VALUES
  ('fit_width', 'Fit Width to Content', 'boolean', 'fit_width', NULL, 'Controls Bubble''s fit_width property.', NULL, 'true', NULL, NULL, 60),
  ('fit_height', 'Fit Height to Content', 'boolean', 'fit_height', NULL, 'Controls Bubble''s fit_height property.', NULL, 'true', NULL, NULL, 61),
  ('single_width', 'Fixed Width', 'boolean', 'single_width', NULL, 'Controls Bubble''s single_width property (fixed width).', NULL, 'false', NULL, NULL, 62),
  ('single_height', 'Fixed Height', 'boolean', 'single_height', NULL, 'Controls Bubble''s single_height property (fixed height).', NULL, 'false', NULL, NULL, 63),
  ('collapse_when_hidden', 'Collapse When Hidden', 'boolean', 'collapse_when_hidden', NULL, 'Controls Bubble''s collapse_when_hidden property.', NULL, 'true', NULL, NULL, 64)
ON CONFLICT (id) DO UPDATE SET
  name            = EXCLUDED.name,
  type            = EXCLUDED.type,
  bubble_property = EXCLUDED.bubble_property,
  description     = EXCLUDED.description,
  default_val     = EXCLUDED.default_val;
