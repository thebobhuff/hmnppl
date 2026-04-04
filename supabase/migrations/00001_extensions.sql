-- ============================================================
-- Migration: 00001_extensions.sql
-- Description: Enable required PostgreSQL extensions
-- ============================================================

-- gen_random_uuid() is built into PostgreSQL 13+ via pgcrypto
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA public;
