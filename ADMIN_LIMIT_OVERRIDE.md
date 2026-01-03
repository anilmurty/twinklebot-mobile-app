# Admin Guide: User Limit Overrides

This guide explains how to set custom monthly story limits for specific users (e.g., early users, coupon holders, VIP users).

## How It Works

The `profiles` table has a `custom_stories_per_month` field:
- **NULL** = User uses their plan's default limit (`stories_per_month`)
- **Number** = Override the plan limit with this custom value

The system automatically uses the custom limit if set, otherwise falls back to the plan limit.

## Setting a Custom Limit

### Via Supabase SQL Editor

1. Open Supabase Dashboard → SQL Editor
2. Run one of these queries:

#### Give a user a specific limit (e.g., 100 stories/month)
\`\`\`sql
UPDATE profiles 
SET custom_stories_per_month = 100 
WHERE email = 'user@example.com';
\`\`\`

#### Give a user unlimited stories (set to very high number)
\`\`\`sql
UPDATE profiles 
SET custom_stories_per_month = 999999 
WHERE email = 'vip@example.com';
\`\`\`

#### Give a user 50 stories/month (for early adopter coupon)
\`\`\`sql
UPDATE profiles 
SET custom_stories_per_month = 50 
WHERE email = 'earlyuser@example.com';
\`\`\`

#### Remove override (revert to plan default)
\`\`\`sql
UPDATE profiles 
SET custom_stories_per_month = NULL 
WHERE email = 'user@example.com';
\`\`\`

### Via Supabase Admin API

You can also update via the Supabase Admin client in your code:

\`\`\`typescript
import { supabaseAdmin } from '@/lib/supabase/server'

// Set custom limit
await supabaseAdmin
  .from('profiles')
  .update({ custom_stories_per_month: 100 })
  .eq('email', 'user@example.com')

// Remove override
await supabaseAdmin
  .from('profiles')
  .update({ custom_stories_per_month: null })
  .eq('email', 'user@example.com')
\`\`\`

## Checking Current Limits

### View all users with custom limits
\`\`\`sql
SELECT 
  email, 
  subscription_plan,
  stories_per_month AS plan_limit,
  custom_stories_per_month AS custom_limit,
  CASE 
    WHEN custom_stories_per_month IS NOT NULL 
    THEN custom_stories_per_month 
    ELSE stories_per_month 
  END AS effective_limit,
  stories_generated_this_month
FROM profiles
WHERE custom_stories_per_month IS NOT NULL
ORDER BY email;
\`\`\`

### View a specific user's limit
\`\`\`sql
SELECT 
  email,
  subscription_plan,
  stories_per_month AS plan_limit,
  custom_stories_per_month AS custom_limit,
  CASE 
    WHEN custom_stories_per_month IS NOT NULL 
    THEN custom_stories_per_month 
    ELSE stories_per_month 
  END AS effective_limit,
  stories_generated_this_month,
  (CASE 
    WHEN custom_stories_per_month IS NOT NULL 
    THEN custom_stories_per_month 
    ELSE stories_per_month 
  END - stories_generated_this_month) AS remaining_this_month
FROM profiles
WHERE email = 'user@example.com';
\`\`\`

## Use Cases

### Early Users / Beta Testers
\`\`\`sql
-- Give early users 50 stories/month
UPDATE profiles 
SET custom_stories_per_month = 50 
WHERE created_at < '2024-01-01';
\`\`\`

### Coupon Holders
\`\`\`sql
-- Give specific users 100 stories/month (one-time coupon)
UPDATE profiles 
SET custom_stories_per_month = 100 
WHERE email IN ('user1@example.com', 'user2@example.com');
\`\`\`

### VIP Users
\`\`\`sql
-- Give VIP users unlimited stories
UPDATE profiles 
SET custom_stories_per_month = 999999 
WHERE subscription_plan = 'premium' 
  AND email IN ('vip1@example.com', 'vip2@example.com');
\`\`\`

### Promotional Campaigns
\`\`\`sql
-- Give all users 10 extra stories this month
UPDATE profiles 
SET custom_stories_per_month = stories_per_month + 10;
\`\`\`

## Important Notes

1. **Effective Limit**: The system uses `custom_stories_per_month` if set, otherwise `stories_per_month`
2. **Monthly Reset**: The `stories_generated_this_month` counter resets monthly (via cron job)
3. **Permanent Override**: Custom limits persist until manually changed or set to NULL
4. **No Expiration**: There's no built-in expiration - you'll need to manually remove overrides when campaigns end

## Best Practices

1. **Document Overrides**: Keep a record of why each user has a custom limit
2. **Review Regularly**: Periodically review custom limits and remove expired promotions
3. **Use High Numbers for "Unlimited"**: Use 999999 instead of -1 for unlimited stories
4. **Test First**: Test limit changes on a test user before applying to production users
