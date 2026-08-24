INSERT INTO atoms (id, name, type, bubble_property, bubble_path, description, options, default_val, min_val, max_val, sort_order) VALUES
  ('image_url', 'Image Source URL', 'url', NULL, 'properties.src.entries.0', 'Controls the source URL of a Bubble image element.', NULL, '', NULL, NULL, 50),
  ('alt', 'Alt Text', 'text', NULL, 'properties.alt_tag.entries.0', 'Alternative text for screen readers and SEO.', NULL, '', NULL, NULL, 51),
  ('four_border_style', 'Independent Borders', 'boolean', 'four_border_style', NULL, 'Enable independent styling for each border side.', NULL, 'false', NULL, NULL, 53),
  ('rotation_angle', 'Rotation Angle', 'number', 'rotation_angle', NULL, 'Rotation angle of the image in degrees.', NULL, '0', 0, 360, 54),
  ('use_aspect_ratio', 'Keep Proportions', 'boolean', 'use_aspect_ratio', NULL, 'Lock the aspect ratio of the image.', NULL, 'true', NULL, NULL, 55),
  ('aspect_ratio_width', 'Aspect Ratio Width', 'number', 'aspect_ratio_width', NULL, 'Width ratio for the aspect ratio calculation.', NULL, '1', 1, 9999, 56),
  ('aspect_ratio_height', 'Aspect Ratio Height', 'number', 'aspect_ratio_height', NULL, 'Height ratio for the aspect ratio calculation.', NULL, '1', 1, 9999, 57)
ON CONFLICT (id) DO UPDATE SET
  name            = EXCLUDED.name,
  type            = EXCLUDED.type,
  bubble_property = EXCLUDED.bubble_property,
  bubble_path     = EXCLUDED.bubble_path,
  description     = EXCLUDED.description,
  options         = EXCLUDED.options,
  default_val     = EXCLUDED.default_val;
