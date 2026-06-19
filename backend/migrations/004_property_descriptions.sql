WITH descriptions(id, description) AS (
  VALUES
    ('label', 'Controls Bubble text content. For text/button elements this maps to properties.text.entries.0.'),
    ('text', 'Controls Bubble text content. Usually maps to properties.text.entries.0.'),
    ('width', 'Controls Bubble element width via properties.width.'),
    ('height', 'Controls Bubble element height via properties.height.'),
    ('min_width_css', 'Controls Bubble responsive minimum width via properties.min_width_css.'),
    ('min_height_css', 'Controls Bubble responsive minimum height via properties.min_height_css.'),
    ('bgcolor', 'Controls the element background/fill color. Usually maps to properties.bgcolor or properties.background_color.'),
    ('fgcolor', 'Controls the main text/icon color. Usually maps to Bubble properties.font_color.'),
    ('border_color', 'Controls the element border color via properties.border_color.'),
    ('border_style', 'Controls Bubble border style via properties.border_style, such as none or solid.'),
    ('border_width', 'Controls Bubble border thickness via properties.border_width.'),
    ('radius', 'Controls corner roundness via Bubble properties.border_roundness.'),
    ('padding', 'Controls inner spacing. Can map to properties.padding or the four padding side properties.'),
    ('font_size', 'Controls text size via Bubble properties.font_size.'),
    ('font_weight', 'Controls text weight where supported. Can map to font weight related Bubble properties.'),
    ('font_bold', 'Controls Bubble bold text via properties.font_bold.'),
    ('icon', 'Controls the icon value for icon-capable Bubble elements.'),
    ('align', 'Controls text/layout alignment. Usually maps to Bubble alignment properties.'),
    ('image_url', 'Controls the image source/url for Bubble image elements.'),
    ('alt', 'Controls image alternative text where Bubble exposes alt text metadata.'),
    ('fit', 'Controls how image content fits inside its box, such as cover, contain, or fill.'),
    ('shadow', 'Controls visual elevation in Bubble JSON when the base element contains shadow-related properties.')
),
updated AS (
  SELECT
    e.id,
    jsonb_object_agg(
      item.key,
      CASE
        WHEN descriptions.description IS NULL THEN item.value
        ELSE item.value || jsonb_build_object('description', descriptions.description)
      END
    ) AS property_schema
  FROM element_definitions e
  CROSS JOIN LATERAL jsonb_each(e.property_schema) AS item(key, value)
  LEFT JOIN descriptions ON descriptions.id = item.key
  GROUP BY e.id
)
UPDATE element_definitions e
SET property_schema = updated.property_schema,
    updated_at = CURRENT_TIMESTAMP
FROM updated
WHERE e.id = updated.id;
