This app has live early access users on a single Supabase + Vercel production environment. There is no staging/dev split. Every change goes directly to production.

## Safe to do anytime
- New UI components, pages, dialogs, API endpoints
- Bug fixes and CSS/styling changes
- Adding new DB columns (ALTER TABLE ADD COLUMN is non-blocking)
- Adding new DB tables
- New migrations that are purely additive

## Requires careful timing
- Renaming or dropping DB columns — deploy the code change and run the migration together, not hours apart
- Changing API response shapes — old cached frontends may expect the old shape
- Run DB migrations immediately before or after the Vercel deploy

## Always confirm with the user before doing
- Destructive DB operations (DROP TABLE, DELETE FROM, TRUNCATE, dropping columns)
- Changes to auth, session, or login behavior
- Modifying payment, credit, or subscription logic that could affect user balances
- Bulk updates to the profiles table
- Resetting or clearing user data
- Force-pushing or rewriting git history on main

## Deployment workflow
1. Test on a Vercel Preview deployment when possible
2. Merge to main — Vercel deploys in ~60 seconds
3. Run any required DB migration right before or after the deploy
4. The risk window is small (~60s) but real — prefer additive, backwards-compatible changes
