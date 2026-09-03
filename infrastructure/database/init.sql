-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Ensure profiles table has all columns required by the SQLAlchemy model.
-- Columns are added conditionally so this is safe to run repeatedly.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_type TEXT;
