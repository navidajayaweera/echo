-- Ensure pgvector is available for existing projects before vector queries.
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
