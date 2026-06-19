UPDATE component_templates 
SET property_schema = jsonb_set(
  jsonb_set(property_schema, '{bgcolor,default}', '"var(--color_primary_default)"'), 
  '{fgcolor,default}', '"var(--color_primary_contrast_default)"'
);

UPDATE components 
SET property_values = jsonb_set(
  jsonb_set(property_values, '{bgcolor}', '"var(--color_primary_default)"'), 
  '{fgcolor}', '"var(--color_primary_contrast_default)"'
);
