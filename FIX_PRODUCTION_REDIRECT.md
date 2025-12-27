# Fix: Production Auth Redirects to Localhost

## Problem
When authenticating in production, users are redirected to `localhost` instead of your production domain.

## Root Causes

This usually happens due to Supabase configuration, not code. The code uses `window.location.origin` which should work correctly.

## Solution Steps

### 1. Update Supabase Site URL

1. Go to **Supabase Dashboard** → Your Project
2. Navigate to **Settings** → **API**
3. Find **Site URL** field
4. Update it to your production domain:
   ```
   https://your-production-domain.com
   ```
   **NOT** `http://localhost:3000`

5. Click **Save**

### 2. Update Redirect URLs in Supabase Auth

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, add your production callback URL:
   ```
   https://your-production-domain.com/auth/callback
   ```
3. You can keep localhost for development:
   ```
   http://localhost:3000/auth/callback
   ```
4. Click **Save**

### 3. Update Google OAuth Redirect URIs (if using Google OAuth)

1. Go to **Google Cloud Console** → Your Project
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add:
   ```
   https://your-production-domain.com/auth/callback
   ```
5. Also ensure Supabase callback is there:
   ```
   https://cxwiutrjgftozbfpnpvv.supabase.co/auth/v1/callback
   ```
6. Click **Save**

### 4. Verify Environment Variables

Make sure your production environment has:

```env
NEXT_PUBLIC_SUPABASE_URL=https://cxwiutrjgftozbfpnpvv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

**Important:** These should be the same values in both development and production (they're public keys).

### 5. Clear Browser Cache

After making changes:
1. Clear browser cache/cookies
2. Try authenticating again

## How to Find Your Production Domain

- **Vercel**: Check your deployment URL (e.g., `your-app.vercel.app`)
- **Custom Domain**: Use your configured custom domain
- **Other Platforms**: Check your hosting provider's documentation

## Testing

1. **Local Development**: Should redirect to `http://localhost:3000/auth/callback`
2. **Production**: Should redirect to `https://your-domain.com/auth/callback`

## Common Mistakes

❌ **Wrong**: Site URL set to `http://localhost:3000` in production  
✅ **Correct**: Site URL set to your production domain

❌ **Wrong**: Only localhost in Redirect URLs  
✅ **Correct**: Both localhost (dev) and production domain

❌ **Wrong**: Google OAuth only has localhost redirect URI  
✅ **Correct**: Both localhost and production domain in Google Cloud Console

## Still Not Working?

1. Check browser console for errors
2. Check Supabase logs: Dashboard → Logs → Auth
3. Verify the callback URL matches exactly (including https/http)
4. Ensure no trailing slashes in URLs
5. Try incognito/private browsing mode to rule out cache issues

