-- Add parameters column to users table for storing preferences
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS parameters JSONB DEFAULT '{}'::jsonb;

-- Comment on column
COMMENT ON COLUMN users.parameters IS 'User specific configuration parameters (JSON)';
