# Fix: Auth Redirects to vercel.app Instead of Custom Domain

## Problem
After authentication, users are redirected to `your-app.vercel.app` instead of your custom domain (e.g., `yourdomain.com`).

## Root Cause
This happens because Supabase uses its **Site URL** configuration to determine where to redirect users after authentication, regardless of what domain they're actually accessing from.

## Solution

### Step 1: Update Supabase Site URL (PRIMARY FIX)

1. Go to **Supabase Dashboard** → Your Project
2. Navigate to **Settings** → **API**
3. Find **Site URL** field
4. Update it to your **custom domain**:
   \`\`\`
   https://your-custom-domain.com
   \`\`\`
   **NOT** `https://your-app.vercel.app`
5. Click **Save**

### Step 2: Update Supabase Redirect URLs

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, ensure both are listed:
   \`\`\`
   https://your-custom-domain.com/auth/callback
   https://your-app.vercel.app/auth/callback
   \`\`\`
   (Keep vercel.app for fallback/debugging)
3. Click **Save**

### Step 3: Update Google OAuth Redirect URIs (if using Google OAuth)

1. Go to **Google Cloud Console** → Your Project
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, ensure both are listed:
   \`\`\`
   https://your-custom-domain.com/auth/callback
   https://your-app.vercel.app/auth/callback
   \`\`\`
5. Also ensure Supabase callback is there:
   \`\`\`
   https://your-project-id.supabase.co/auth/v1/callback
   \`\`\`
6. Click **Save**

### Step 4: Set Environment Variable (Optional but Recommended)

Add to your Vercel environment variables:

**Variable:** `NEXT_PUBLIC_SITE_URL`  
**Value:** `https://your-custom-domain.com`

This helps the code detect your custom domain and use it for redirects.

### Step 5: Clear Browser Cache

After making changes:
1. Clear browser cache/cookies
2. Try authenticating again in an incognito/private window

## Code Changes Made

The code has been updated to:
- Check for `NEXT_PUBLIC_SITE_URL` environment variable
- Use Vercel's `x-forwarded-host` header to detect custom domains
- Fall back to request origin if neither is available

## Testing

1. **Access via custom domain**: `https://your-custom-domain.com`
2. **Click "Sign in with Google"**
3. **After authentication**: Should redirect back to `https://your-custom-domain.com` (not vercel.app)

## Common Mistakes

❌ **Wrong**: Site URL set to `https://your-app.vercel.app`  
✅ **Correct**: Site URL set to `https://your-custom-domain.com`

❌ **Wrong**: Only vercel.app in Redirect URLs  
✅ **Correct**: Both custom domain AND vercel.app in Redirect URLs

❌ **Wrong**: Missing custom domain in Google OAuth redirect URIs  
✅ **Correct**: Both custom domain AND vercel.app in Google OAuth

## Still Not Working?

1. **Check Supabase Logs**: Dashboard → Logs → Auth
2. **Verify Site URL**: Make sure it's exactly your custom domain (no trailing slash)
3. **Check Redirect URLs**: Must match exactly (including https/http)
4. **Test in Incognito**: Rules out cache/cookie issues
5. **Check Browser Console**: Look for any redirect errors

## Important Notes

- The **Site URL** in Supabase is the most important setting - this is what Supabase uses for redirects
- The code changes help, but Supabase configuration is the primary fix
- You can keep both domains in Redirect URLs for flexibility
- Changes may take a few minutes to propagate
