ALTER TABLE component_templates
ADD COLUMN IF NOT EXISTS rules_json JSONB NOT NULL DEFAULT '{}';

UPDATE component_templates
SET rules_json = jsonb_set(
  COALESCE(NULLIF(rules_json, 'null'::jsonb), '{}'::jsonb),
  '{layout}',
  '{"height_mode":"fixed","enforce_fixed_height":true,"description":"Buttons must compile with fit_height=false and single_height=true so Bubble keeps the explicit numeric height."}'::jsonb,
  true
)
WHERE component_type_id = 'type_button';
