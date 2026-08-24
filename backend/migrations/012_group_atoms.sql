INSERT INTO atoms (id, name, type, bubble_property, bubble_path, description, options, default_val, min_val, max_val, sort_order) VALUES
  ('container_layout', 'Container Layout', 'select', 'container_layout', NULL, 'Controls Bubble''s container layout type.', '["column","row","align_to_parent","fixed"]', 'column', NULL, NULL, 35),
  ('background_style', 'Background Style', 'select', 'background_style', NULL, 'Type of background (none, color, gradient, image).', '["none","bgcolor","gradient","image"]', 'bgcolor', NULL, NULL, 11)
ON CONFLICT (id) DO UPDATE SET
  name            = EXCLUDED.name,
  type            = EXCLUDED.type,
  bubble_property = EXCLUDED.bubble_property,
  bubble_path     = EXCLUDED.bubble_path,
  description     = EXCLUDED.description,
  options         = EXCLUDED.options,
  default_val     = EXCLUDED.default_val;

-- Update the existing border_style to include all the options from the screenshot
UPDATE atoms 
SET options = '["none","solid","dotted","dashed","double","groove","ridge","inset","outset"]'
WHERE id = 'border_style';
