-- Setup script for local PostgreSQL 16
-- Run with: psql -U postgres -f setup_local_db.sql

-- Create database
DROP DATABASE IF EXISTS challenge_db;
CREATE DATABASE challenge_db WITH ENCODING 'UTF8';

-- Connect to the new database
\c challenge_db

-- Create user (if not using postgres user)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'challenge') THEN
        CREATE USER challenge WITH PASSWORD 'challenge_2024';
    END IF;
END
$$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE challenge_db TO challenge;
GRANT ALL PRIVILEGES ON SCHEMA public TO challenge;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO challenge;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO challenge;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO challenge;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO challenge;

\echo 'Database challenge_db created successfully!'
\echo 'User: challenge (password: challenge_2024)'
\echo 'Or use: postgres (password: 123456)'
