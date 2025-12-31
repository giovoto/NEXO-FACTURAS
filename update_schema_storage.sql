-- Add file_path column to facturas table to reference stored files
ALTER TABLE facturas 
ADD COLUMN IF NOT EXISTS file_path TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_facturas_file_path ON facturas(file_path);
