# Shared cloud database: 2026-11-08

Supabase project IT CAMPUS Year Course (gtckwzqbrwhaesjacjau). The new campus_live schema is separate from the unused campus staging schema. Server connections use TLS verify-full and the transaction pooler. campus_runtime has explicit limited DML grants and request-scoped RLS; no ownership, DDL or bypassrls. Policies resolve authenticated sessions, verified Google identity and staff class scope. Credentials are in private data/cloud-private.json (0600) and Vercel sensitive environment variables, never GitHub or public files.

Migration backup: data/pre-cloud-backup.sqlite3 (0600). Migrated and verified: 3 users, 9 attempts, 1 lesson reflection, 17 audit entries. No manual grades existed; automatic grades are calculated server-side from submitted evidence. Active sessions were not copied: sign in again at the new domain. Existing original project remains unchanged.

Checks: student sees only own profile; teacher cannot see admin; admin sees all three. Two independent database connections returned identical progress/grades for 47 lessons. Manual zero-grade readback was verified in a rolled-back transaction. No fake accounts or test grades were retained.

Supabase advisor: no campus_live findings. Six INFO no-policy notices belong to intentionally closed, unused campus staging tables.

HTTPS deployment and actual Google sign-in verification are tracked separately. Do not claim public availability until deployment validation is complete.
