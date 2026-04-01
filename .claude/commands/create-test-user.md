Create a test user with email/password auth and early access credits. Takes email and password as input.

**Note: This creates a real user in the production database.**

Arguments: $ARGUMENTS (format: `email password`)

Parse the arguments into email and password. If only one argument is provided, ask for the missing one.

## Step 1 — Create the auth user

Run this in the Supabase SQL editor:

```sql
-- Create auth user with email/password
-- Supabase will auto-confirm since we set email_confirmed_at
SELECT id FROM auth.users WHERE email = '<email>';
-- If the above returns a row, the user already exists. Stop and tell the user.

-- Create the user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  '<email>',
  crypt('<password>', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  'authenticated',
  'authenticated'
);
```

## Step 2 — Verify the profile was auto-created with credits

The `handle_new_user` trigger should have created a profile with 4 premium credits automatically. Verify:

```sql
SELECT p.id, p.email, p.premium_credits, p.basic_credits, p.created_at
FROM profiles p
WHERE p.email = '<email>';
```

If `premium_credits` is not 4, the trigger may not have fired. Fix manually:

```sql
-- Only run this if the profile wasn't auto-created
INSERT INTO profiles (id, email, premium_credits)
SELECT id, email, 4 FROM auth.users WHERE email = '<email>'
ON CONFLICT (id) DO UPDATE SET premium_credits = 4;
```

## Step 3 — Confirm login works

Tell the user they can now sign in at the app using:
- Email: `<email>`
- Password: `<password>`

Note: This user uses email/password auth, not Google OAuth. The app's login page must support email/password login for this to work. If it only supports Google OAuth, the user will need to use Supabase Auth UI or the API directly to get a session.

## Cleanup

To delete this test user later, use `/cleanup-user <email>`.
