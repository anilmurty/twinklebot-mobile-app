Delete a user and all their data from the database and storage. Takes an email address as input.

**IMPORTANT: This is a destructive operation on a production database with live users. Always confirm with the user before executing.**

Given the email address: $ARGUMENTS

Generate the SQL statements to delete this user and all their associated data. The SQL must be run in the Supabase SQL editor.

## Step 1 — Preview what will be deleted

```sql
-- Preview: profile and data counts
SELECT p.id, p.email, p.created_at,
  (SELECT count(*) FROM storybooks WHERE user_id = p.id) as storybooks,
  (SELECT count(*) FROM characters WHERE user_id = p.id) as characters
FROM profiles p
WHERE p.email = '<email>';

-- Preview: confirm auth user exists
SELECT id, email, created_at FROM auth.users WHERE email = '<email>';
```

Tell the user to run this first and verify the output before proceeding.

## Step 2 — Collect storage paths to delete

```sql
-- Storage: storybook scene folders (each storybook ID is a folder in storybook-scenes bucket)
SELECT id as storybook_folder FROM storybooks
WHERE user_id = (SELECT id FROM profiles WHERE email = '<email>');

-- Storage: character photo paths (in character-photos bucket)
SELECT front_photo_url FROM characters
WHERE user_id = (SELECT id FROM profiles WHERE email = '<email>');

-- Storage: character variation paths (in character-variations bucket)
SELECT front_variation_url, left_variation_url, right_variation_url
FROM character_variations
WHERE character_id IN (
  SELECT id FROM characters WHERE user_id = (SELECT id FROM profiles WHERE email = '<email>')
);
```

Tell the user to note these paths — they'll need to delete the corresponding folders/files from Supabase Storage > Buckets manually (storybook-scenes, character-photos, character-variations).

## Step 3 — Delete database records (dependency order)

```sql
-- Delete generation jobs
DELETE FROM generation_jobs WHERE storybook_id IN (
  SELECT id FROM storybooks WHERE user_id = (SELECT id FROM profiles WHERE email = '<email>')
);

-- Delete storybooks
DELETE FROM storybooks WHERE user_id = (SELECT id FROM profiles WHERE email = '<email>');

-- Delete character variations
DELETE FROM character_variations WHERE character_id IN (
  SELECT id FROM characters WHERE user_id = (SELECT id FROM profiles WHERE email = '<email>')
);

-- Delete characters
DELETE FROM characters WHERE user_id = (SELECT id FROM profiles WHERE email = '<email>');

-- Delete device tokens
DELETE FROM device_tokens WHERE user_id = (SELECT id FROM profiles WHERE email = '<email>');

-- Delete story interest
DELETE FROM story_interest WHERE user_id = (SELECT id FROM profiles WHERE email = '<email>');

-- Delete subscriptions
DELETE FROM subscriptions WHERE user_id = (SELECT id FROM profiles WHERE email = '<email>');

-- Delete profile
DELETE FROM profiles WHERE email = '<email>';
```

## Step 4 — Delete auth user (most irreversible step)

```sql
-- This removes the user's authentication record entirely.
-- They will need to sign up again (and will get fresh early access credits).
-- Confirm the profile delete above succeeded before running this.
DELETE FROM auth.users WHERE email = '<email>';
```

## Step 5 — Clean up storage

Remind the user to manually delete from Supabase Storage > Buckets:
- `storybook-scenes/{storybook_id}/` for each storybook ID from Step 2
- `character-photos/{user_id}/{character_id}/` for each character
- `character-variations/{user_id}/{character_id}/` for each character

These orphaned files won't cause errors but will accumulate storage usage over time.

## Final verification

```sql
-- Confirm user is fully removed
SELECT count(*) as remaining_profiles FROM profiles WHERE email = '<email>';
SELECT count(*) as remaining_auth FROM auth.users WHERE email = '<email>';
```
