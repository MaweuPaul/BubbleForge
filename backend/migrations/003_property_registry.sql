CREATE TABLE IF NOT EXISTS element_definitions (
  id                TEXT PRIMARY KEY,
  slug              TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  bubble_type       TEXT NOT NULL,
  category          TEXT NOT NULL,
  description       TEXT,
  base_json         JSONB NOT NULL,
  property_schema   JSONB NOT NULL DEFAULT '{}',
  property_mappings JSONB NOT NULL DEFAULT '{}',
  status            TEXT NOT NULL DEFAULT 'draft',
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS component_presets (
  id                    TEXT PRIMARY KEY,
  element_definition_id TEXT NOT NULL REFERENCES element_definitions(id),
  name                  TEXT NOT NULL,
  slug                  TEXT NOT NULL UNIQUE,
  category              TEXT NOT NULL,
  description           TEXT,
  access                TEXT NOT NULL DEFAULT 'Free',
  property_values       JSONB NOT NULL DEFAULT '{}',
  status                TEXT NOT NULL DEFAULT 'published',
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO element_definitions (
  id,
  slug,
  name,
  bubble_type,
  category,
  description,
  base_json,
  property_schema,
  property_mappings,
  status
) VALUES (
  'element_button',
  'button',
  'Button',
  'Button',
  'Buttons',
  'Base Bubble button element. Button presets are reconstructed from property values instead of storing separate copied buttons.',
  '{
    "type": "copy",
    "elements": [
      {
        "type": "Button",
        "id": "bfBtn0",
        "default_name": "BF: Button",
        "properties": {
          "height": "{{HEIGHT}}",
          "width": "{{WIDTH}}",
          "zindex": 2,
          "order": 1,
          "fit_width": true,
          "fit_height": true,
          "single_width": false,
          "min_width_css": "{{MIN_WIDTH_CSS}}",
          "single_height": false,
          "min_height_css": "{{MIN_HEIGHT_CSS}}",
          "horiz_alignment": "center",
          "collapse_when_hidden": true,
          "border_roundness": "{{RADIUS}}",
          "border_style": "{{BORDER_STYLE}}",
          "border_width": "{{BORDER_WIDTH}}",
          "border_color": "{{BORDER_COLOR}}",
          "bgcolor": "{{BGCOLOR}}",
          "font_color": "{{FGCOLOR}}",
          "font_size": "{{FONT_SIZE}}",
          "font_bold": "{{FONT_BOLD}}",
          "text": {
            "type": "TextExpression",
            "entries": {
              "0": "{{LABEL}}"
            }
          }
        },
        "states": {
          "0": {
            "type": "State",
            "condition": {
              "type": "PageData",
              "properties": {
                "name": "Current Page Width"
              },
              "next": {
                "type": "Message",
                "name": "less_or_equal_than",
                "is_slidable": false,
                "args": {
                  "type": "Breakpoint",
                  "properties": {
                    "breakpoint_id": "built-in-mobile-landing"
                  },
                  "next": null,
                  "is_slidable": false
                }
              },
              "is_slidable": false
            },
            "properties": {
              "min_width_css": "100%"
            }
          }
        }
      }
    ]
  }',
  '{
    "label": {"type": "text", "label": "Label", "default": "Button"},
    "width": {"type": "number", "label": "Width", "default": 150, "min": 80, "max": 420},
    "height": {"type": "number", "label": "Height", "default": 44, "min": 32, "max": 96},
    "min_width_css": {"type": "text", "label": "Min Width", "default": "120px"},
    "min_height_css": {"type": "text", "label": "Min Height", "default": "44px"},
    "bgcolor": {"type": "color", "label": "Background", "default": "var(--color_primary_default)"},
    "fgcolor": {"type": "color", "label": "Text Color", "default": "var(--color_primary_contrast_default)"},
    "border_color": {"type": "color", "label": "Border", "default": "var(--color_primary_default)"},
    "border_style": {"type": "select", "label": "Border Style", "default": "none", "options": ["none", "solid"]},
    "border_width": {"type": "number", "label": "Border Width", "default": 0, "min": 0, "max": 8},
    "radius": {"type": "number", "label": "Radius", "default": 8, "min": 0, "max": 999},
    "font_size": {"type": "number", "label": "Font Size", "default": 14, "min": 10, "max": 32},
    "font_bold": {"type": "boolean", "label": "Bold", "default": true}
  }',
  '{
    "label": "properties.text.entries.0",
    "width": "properties.width",
    "height": "properties.height",
    "bgcolor": "properties.bgcolor",
    "fgcolor": "properties.font_color",
    "border_color": "properties.border_color",
    "border_style": "properties.border_style",
    "border_width": "properties.border_width",
    "radius": "properties.border_roundness",
    "font_size": "properties.font_size",
    "font_bold": "properties.font_bold"
  }',
  'published'
)
ON CONFLICT (slug) DO UPDATE SET
  base_json = EXCLUDED.base_json,
  property_schema = EXCLUDED.property_schema,
  property_mappings = EXCLUDED.property_mappings,
  status = EXCLUDED.status,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO component_presets (
  id,
  element_definition_id,
  name,
  slug,
  category,
  description,
  access,
  property_values,
  status
) VALUES
  (
    'preset-button-solid',
    'element_button',
    'Solid Button',
    'solid-button',
    'Buttons',
    'A filled primary button reconstructed from the base Button element definition.',
    'Free',
    '{"label":"Submit","width":150,"height":44,"min_width_css":"120px","min_height_css":"44px","bgcolor":"var(--color_primary_default)","fgcolor":"var(--color_primary_contrast_default)","border_color":"var(--color_primary_default)","border_style":"none","border_width":0,"radius":8,"font_size":14,"font_bold":true}',
    'published'
  ),
  (
    'preset-button-outline',
    'element_button',
    'Outline Button',
    'outline-button',
    'Buttons',
    'A transparent button with app-primary text and border.',
    'Free',
    '{"label":"Secondary","width":150,"height":44,"min_width_css":"120px","min_height_css":"44px","bgcolor":"rgba(255,255,255,0)","fgcolor":"var(--color_primary_default)","border_color":"var(--color_primary_default)","border_style":"solid","border_width":1,"radius":8,"font_size":14,"font_bold":true}',
    'published'
  ),
  (
    'preset-button-ghost',
    'element_button',
    'Ghost Button',
    'ghost-button',
    'Buttons',
    'A minimal text-style button using the app primary color.',
    'Free',
    '{"label":"Cancel","width":150,"height":44,"min_width_css":"120px","min_height_css":"44px","bgcolor":"rgba(255,255,255,0)","fgcolor":"var(--color_primary_default)","border_color":"rgba(255,255,255,0)","border_style":"none","border_width":0,"radius":8,"font_size":14,"font_bold":true}',
    'published'
  ),
  (
    'preset-button-pill',
    'element_button',
    'Pill Button',
    'pill-button',
    'Buttons',
    'A rounded primary pill button generated from the base Button definition.',
    'Free',
    '{"label":"Pill Action","width":150,"height":44,"min_width_css":"120px","min_height_css":"44px","bgcolor":"var(--color_primary_default)","fgcolor":"var(--color_primary_contrast_default)","border_color":"var(--color_primary_default)","border_style":"none","border_width":0,"radius":999,"font_size":14,"font_bold":true}',
    'published'
  ),
  (
    'preset-button-soft',
    'element_button',
    'Soft Button',
    'soft-button',
    'Buttons',
    'A soft tinted button using the app primary color for text.',
    'Free',
    '{"label":"Get Started","width":150,"height":44,"min_width_css":"120px","min_height_css":"44px","bgcolor":"rgba(30,109,246,0.12)","fgcolor":"var(--color_primary_default)","border_color":"rgba(255,255,255,0)","border_style":"none","border_width":0,"radius":8,"font_size":14,"font_bold":true}',
    'published'
  ),
  (
    'preset-button-destructive',
    'element_button',
    'Destructive Button',
    'destructive-button',
    'Buttons',
    'A destructive action button generated from semantic danger colors.',
    'Free',
    '{"label":"Delete","width":150,"height":44,"min_width_css":"120px","min_height_css":"44px","bgcolor":"var(--color_destructive_default)","fgcolor":"var(--color_primary_contrast_default)","border_color":"var(--color_destructive_default)","border_style":"none","border_width":0,"radius":8,"font_size":14,"font_bold":true}',
    'published'
  )
ON CONFLICT (slug) DO UPDATE SET
  property_values = EXCLUDED.property_values,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  updated_at = CURRENT_TIMESTAMP;
