CREATE TABLE IF NOT EXISTS component_types (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS component_templates (
  id                TEXT PRIMARY KEY,
  component_type_id TEXT NOT NULL REFERENCES component_types(id),
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  base_json         JSONB NOT NULL,
  property_schema   JSONB NOT NULL DEFAULT '{}',
  preview_html      TEXT,
  status            TEXT NOT NULL DEFAULT 'draft',
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Safely add columns to existing table
ALTER TABLE components ADD COLUMN IF NOT EXISTS template_id TEXT REFERENCES component_templates(id);
ALTER TABLE components ADD COLUMN IF NOT EXISTS property_values JSONB NOT NULL DEFAULT '{}';
ALTER TABLE components ADD COLUMN IF NOT EXISTS migration_status TEXT;

CREATE TABLE IF NOT EXISTS component_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id    VARCHAR(255) NOT NULL REFERENCES components(id),
  parent_id       UUID REFERENCES component_versions(id),
  version_number  INT NOT NULL DEFAULT 1,
  property_values JSONB NOT NULL,
  compiled_json   JSONB,
  change_summary  TEXT,
  created_by      TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS brand_tokens (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT,
  primary_color    TEXT NOT NULL DEFAULT '#ea580c',
  secondary_color  TEXT NOT NULL DEFAULT '#0f172a',
  text_color       TEXT NOT NULL DEFAULT '#ffffff',
  background_color TEXT NOT NULL DEFAULT '#ffffff',
  border_radius    INT  NOT NULL DEFAULT 8,
  font_family      TEXT NOT NULL DEFAULT 'Inter, ui-sans-serif',
  custom_tokens    JSONB DEFAULT '{}',
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
