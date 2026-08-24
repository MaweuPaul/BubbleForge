-- Phase 2: Introduce an atoms table — the canonical property dictionary.
-- Each row describes one designable property, what type it is,
-- and which native Bubble JSON property it controls.
-- Templates reference atoms by ID via property_schema instead of duplicating metadata.

CREATE TABLE IF NOT EXISTS atoms (
  id              TEXT PRIMARY KEY,          -- canonical key, e.g. 'bgcolor', 'radius'
  name            TEXT NOT NULL,             -- human label, e.g. 'Background Color'
  type            TEXT NOT NULL,             -- 'color' | 'number' | 'text' | 'select' | 'boolean' | 'url'
  bubble_property TEXT,                      -- flat Bubble property name, e.g. 'border_roundness'
  bubble_path     TEXT,                      -- dot-path for nested props, e.g. 'properties.text.entries.0'
  description     TEXT,                      -- shown in the extension's Customize Panel
  options         JSONB,                     -- for type='select': ["none","solid","dashed"]
  default_val     TEXT,                      -- default value as a string
  min_val         INT,                       -- for type='number'
  max_val         INT,                       -- for type='number'
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO atoms (id, name, type, bubble_property, bubble_path, description, options, default_val, min_val, max_val, sort_order) VALUES

  -- Text content
  ('label',        'Label',         'text',    NULL,                  'properties.text.entries.0', 'The text content shown inside the element. Controls Bubble''s text.entries[0].', NULL, 'Button', NULL, NULL, 1),
  ('text',         'Text',          'text',    NULL,                  'properties.text.entries.0', 'The text content shown inside the element. Controls Bubble''s text.entries[0].', NULL, 'Text',   NULL, NULL, 2),

  -- Colors
  ('bgcolor',      'Background',    'color',   'bgcolor',             NULL, 'Controls Bubble''s bgcolor property — the fill color of the element.',          NULL, '#0f172a',    NULL, NULL, 10),
  ('fgcolor',      'Text Color',    'color',   'font_color',          NULL, 'Controls Bubble''s font_color property — the color of text/icons inside.',     NULL, '#ffffff',    NULL, NULL, 11),
  ('border_color', 'Border Color',  'color',   'border_color',        NULL, 'Controls Bubble''s border_color property — the color of the element outline.', NULL, 'transparent',NULL, NULL, 12),
  ('shadow_color', 'Shadow Color',  'color',   NULL,                  NULL, 'Controls shadow/blur color where supported in Bubble''s element properties.',  NULL, 'rgba(0,0,0,0.12)', NULL, NULL, 13),

  -- Border & Shape
  ('radius',       'Radius',        'number',  'border_roundness',    NULL, 'Controls Bubble''s border_roundness property — corner rounding in px.',   NULL, '8',   0, 999, 20),
  ('border_style', 'Border Style',  'select',  'border_style',        NULL, 'Controls Bubble''s border_style property. Use solid, dashed, or none.',   '["none","solid","dashed"]', 'none', NULL, NULL, 21),
  ('border_width', 'Border Width',  'number',  'border_width',        NULL, 'Controls Bubble''s border_width property — outline thickness in px.',     NULL, '0',   0, 16, 22),

  -- Size & Layout
  ('width',          'Width',        'number',  'width',              NULL, 'Controls Bubble''s width property — the element''s fixed width in px.',           NULL, '150', 40, 1200, 30),
  ('height',         'Height',       'number',  'height',             NULL, 'Controls Bubble''s height property — the element''s fixed height in px.',          NULL, '44',  20, 400,  31),
  ('min_width_css',  'Min Width',    'text',    'min_width_css',      NULL, 'Controls Bubble''s min_width_css property — responsive minimum width, e.g. 120px.', NULL, '120px', NULL, NULL, 32),
  ('min_height_css', 'Min Height',   'text',    'min_height_css',     NULL, 'Controls Bubble''s min_height_css property — responsive minimum height, e.g. 44px.',NULL, '44px',  NULL, NULL, 33),
  ('padding',        'Padding',      'number',  'padding',            NULL, 'Controls inner spacing. Maps to Bubble''s padding_top, padding_bottom, padding_left, padding_right properties.', NULL, '8', 0, 64, 34),

  -- Typography
  ('font_size',    'Font Size',     'number',  'font_size',           NULL, 'Controls Bubble''s font_size property — text size in px.',                    NULL, '14', 8, 72, 40),
  ('font_bold',    'Bold',          'boolean', 'font_bold',           NULL, 'Controls Bubble''s font_bold property — whether text is rendered bold.',      NULL, 'true', NULL, NULL, 41),
  ('font_italic',  'Italic',        'boolean', 'font_italic',         NULL, 'Controls Bubble''s font_italic property — whether text is rendered in italic.',NULL, 'false', NULL, NULL, 42),
  ('font_family',  'Font Family',   'text',    'font_family',         NULL, 'Controls Bubble''s font_family property — which typeface to use.',             NULL, 'Inter', NULL, NULL, 43),
  ('alignment',    'Alignment',     'select',  'horiz_alignment',     NULL, 'Controls Bubble''s horiz_alignment property — horizontal text alignment.',    '["left","center","right"]', 'center', NULL, NULL, 44),

  -- Image
  ('image_url',  'Image URL',       'url',     NULL,                  'properties.image_source', 'Controls the source URL of a Bubble image element.', NULL, '', NULL, NULL, 50),
  ('alt',        'Alt Text',        'text',    NULL,                  NULL, 'Alternative text for the image. Stored in Bubble element metadata.',          NULL, '', NULL, NULL, 51),
  ('fit',        'Fit Mode',        'select',  'image_fit',           NULL, 'Controls Bubble''s image_fit property — how the image fills its container.', '["cover","contain","stretch"]', 'cover', NULL, NULL, 52)

ON CONFLICT (id) DO UPDATE SET
  name            = EXCLUDED.name,
  type            = EXCLUDED.type,
  bubble_property = EXCLUDED.bubble_property,
  bubble_path     = EXCLUDED.bubble_path,
  description     = EXCLUDED.description,
  options         = EXCLUDED.options,
  default_val     = EXCLUDED.default_val,
  min_val         = EXCLUDED.min_val,
  max_val         = EXCLUDED.max_val,
  sort_order      = EXCLUDED.sort_order;
