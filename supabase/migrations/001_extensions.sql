CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE sync_status AS ENUM ('pending', 'synced', 'failed');
