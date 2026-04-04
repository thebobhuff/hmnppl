"""RLS + RBAC Test Suite for AI HR Platform.

This test suite validates Row-Level Security (RLS) policies and
Role-Based Access Control (RBAC) across all multi-tenant tables.

Requirements:
- Supabase local dev running (`supabase start`)
- PostgreSQL connection available at the local dev URL
- All 20 migrations applied

Run with:
    pytest tests/ -v --tb=short
"""
