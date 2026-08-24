INSERT INTO atoms (id, name, type, bubble_property, bubble_path, description, options, default_val, min_val, max_val, sort_order) VALUES
  ('zindex', 'Z-Index', 'number', 'zindex', NULL, 'Controls Bubble''s zindex property for stacking order.', NULL, '1', 0, 9999, 80)
ON CONFLICT (id) DO UPDATE SET
  name            = EXCLUDED.name,
  type            = EXCLUDED.type,
  bubble_property = EXCLUDED.bubble_property,
  bubble_path     = EXCLUDED.bubble_path,
  description     = EXCLUDED.description,
  options         = EXCLUDED.options,
  default_val     = EXCLUDED.default_val;
