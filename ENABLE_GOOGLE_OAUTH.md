# How to Enable Google OAuth in Supabase

If you're seeing the error "Unsupported provider: provider is not enabled", you need to enable Google OAuth in your Supabase project.

## Steps to Enable Google OAuth:

1. **Go to your Supabase Dashboard**
   - Visit https://app.supabase.com
   - Select your project

2. **Navigate to Authentication Settings**
   - Click on **Authentication** in the left sidebar
   - Click on **Providers** tab

3. **Enable Google Provider**
   - Find **Google** in the list of providers
   - Toggle it **ON**

4. **Set up Google OAuth Credentials**
   - You'll need to create OAuth credentials in Google Cloud Console:
     - Go to https://console.cloud.google.com
     - Create a new project (or select existing)
     - Go to **APIs & Services** > **Credentials**
     - Click **Create Credentials** > **OAuth client ID**
     - Choose **Web application**
     - Add authorized redirect URIs:
       - `https://cxwiutrjgftozbfpnpvv.supabase.co/auth/v1/callback`
       - `http://localhost:3000/auth/callback` (for local development)
     - Copy the **Client ID** and **Client Secret**

5. **Add Credentials to Supabase**
   - Back in Supabase, paste your **Client ID** and **Client Secret**
   - Click **Save**

6. **Test**
   - Try signing in with Google again
   - It should redirect to Google's sign-in page

## Alternative: Use Email/Password Authentication

If you don't want to set up Google OAuth right now, you can use email/password authentication:

1. **Enable Email Provider** (usually enabled by default)
   - Go to **Authentication** > **Providers** in Supabase
   - Make sure **Email** is enabled

2. **Use the Email Form**
   - Click "Sign in with Email" on the landing page
   - Enter your email and password
   - Click "Sign Up" if you don't have an account yet

## Notes:

- For production, make sure to add your production domain to the authorized redirect URIs in Google Cloud Console
- Email verification is optional but recommended for production
- You can enable multiple providers (Google, Facebook, etc.) simultaneously

