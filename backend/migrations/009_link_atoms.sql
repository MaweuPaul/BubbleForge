INSERT INTO atoms (id, name, type, bubble_property, bubble_path, description, options, default_val, min_val, max_val, sort_order) VALUES
  ('open_in_new_tab', 'Open in New Tab', 'boolean', 'open_in_new_tab', NULL, 'Open link in a new browser tab.', NULL, 'false', NULL, NULL, 70),
  ('link_disabled', 'Disable Link', 'boolean', 'link_disabled', NULL, 'Disable the link from being clicked.', NULL, 'false', NULL, NULL, 71),
  ('nofollow', 'No Follow (SEO)', 'boolean', 'nofollow', NULL, 'Adds rel="nofollow" for SEO.', NULL, 'false', NULL, NULL, 72),
  ('keep_current_page_params', 'Keep URL Parameters', 'boolean', 'keep_current_page_params', NULL, 'Keep current page URL parameters.', NULL, 'false', NULL, NULL, 73),
  ('title_attribute', 'Title Attribute (Tooltip)', 'text', NULL, 'properties.title_attribute.entries.0', 'HTML title attribute shown on hover.', NULL, '', NULL, NULL, 74),
  ('boxshadow_style', 'Box Shadow Style', 'select', 'boxshadow_style', NULL, 'Style of the box shadow.', '["none","outset","inset"]', 'none', NULL, NULL, 75)
ON CONFLICT (id) DO UPDATE SET
  name            = EXCLUDED.name,
  type            = EXCLUDED.type,
  bubble_property = EXCLUDED.bubble_property,
  bubble_path     = EXCLUDED.bubble_path,
  description     = EXCLUDED.description,
  options         = EXCLUDED.options,
  default_val     = EXCLUDED.default_val;
