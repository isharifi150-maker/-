# Supabase setup

1. Open the project's Supabase **SQL Editor**.
2. Run `supabase/schema.sql` once.
3. Verify `.env` contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Start the app with `npm install` then `npm run dev`, or deploy the generated `dist` directory.

The evidence bucket is named `employee-evidence`. Evidence file metadata and URLs are stored in the `evidence` table. Evaluation criterion scores are stored in the `scores` JSONB column of the `evaluations` table, so the browser has no IndexedDB/localStorage data source.

> Security note: the current application has a legacy custom username/password login. To preserve its behavior, the included policies permit the anon client to access these tables. For a public production system, move authentication to Supabase Auth and replace these permissive policies with per-user/per-role RLS policies.
