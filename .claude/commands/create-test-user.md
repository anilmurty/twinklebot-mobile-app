Create a test user with email/password auth and early access credits. Takes email and password as input.

**Note: This creates a real user in the production database.**

Arguments: $ARGUMENTS (format: `email password`)

Parse the arguments into email and password. If only one argument is provided, ask for the missing one.

## Step 1 — Check if user already exists

Run in Supabase SQL editor:

```sql
SELECT id, email FROM auth.users WHERE email = '<email>';
```

If that returns a row, the user already exists. Stop and tell the user.

## Step 2 — Create the user via Supabase Dashboard

Direct SQL INSERT into auth.users does not work reliably — it skips internal Supabase auth setup and causes "Database error querying schema" on login.

Instead, create the user through the Supabase Dashboard:

1. Go to **Authentication > Users**
2. Click **Add User > Create new user**
3. Email: `<email>`
4. Password: `<password>`
5. Check **Auto Confirm User**
6. Click **Create**

The `handle_new_user` trigger will automatically create a profile with 4 premium credits.

## Step 3 — Verify profile was created with credits

```sql
SELECT p.id, p.email, p.premium_credits, p.basic_credits, p.created_at
FROM profiles p
WHERE p.email = '<email>';
```

Should show `premium_credits = 4`. If not:

```sql
INSERT INTO profiles (id, email, premium_credits)
SELECT id, email, 4 FROM auth.users WHERE email = '<email>'
ON CONFLICT (id) DO UPDATE SET premium_credits = 4;
```

## Step 4 — Sign in

The user can now sign in at the app using:
- Email: `<email>`
- Password: `<password>`

Use the email/password form on the landing page.

## Cleanup

To delete this test user later, use `cleanup-user <email>`.
