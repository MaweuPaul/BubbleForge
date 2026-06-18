-- 002_drop_bubble_json.sql

-- Drop the legacy bubble_json column from components now that the compiler migration is complete
ALTER TABLE components DROP COLUMN IF EXISTS bubble_json;
