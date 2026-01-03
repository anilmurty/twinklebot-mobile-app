# Design Mode - v0.dev Integration Guide

This document explains how to use Design Mode to preview and edit your app in v0.dev without requiring authentication or database setup.

## What is Design Mode?

Design Mode is a special mode that bypasses authentication and database requirements, allowing v0.dev to render your app pages for design improvements. When enabled:

- ✅ All app screens render without authentication
- ✅ No Supabase connection required
- ✅ No database queries executed
- ✅ Perfect for UI/UX design work in v0.dev

## How It Works

Design Mode is automatically detected in two ways:

1. **Environment Variable**: Set `DESIGN_MODE=1` (server-side) and `NEXT_PUBLIC_DESIGN_MODE=1` (client-side) in `.env.local`
2. **Hostname Detection**: Automatically enabled when accessed via `*.v0.dev` domain

## Setup

### Option 1: Environment Variable (Local Development)

Add to your `.env.local` file:

```bash
DESIGN_MODE=1
NEXT_PUBLIC_DESIGN_MODE=1
```

**Important**:
- `DESIGN_MODE=1` is used by server-side code (middleware)
- `NEXT_PUBLIC_DESIGN_MODE=1` is used by client-side code (React components)
- Remove both or set to `0` when running normally, as it bypasses all authentication.

### Option 2: Automatic (v0.dev)

When you paste your app URL into v0.dev, Design Mode is automatically enabled based on the `v0.dev` hostname. No configuration needed!

## What Gets Bypassed

### 1. Middleware (`middleware.ts`)
- Skips Supabase session refresh
- No auth checks performed
- All requests pass through

### 2. Authentication (`lib/auth-context.tsx`)
- Provides a mock user automatically
- Skips all Supabase auth calls
- Auth methods (signIn, signOut, etc.) are no-ops

### 3. Page Rendering (`app/page.tsx`)
- Always shows app UI (bypasses `!user` check)

### 4. API Client (`lib/api-client.ts`)
- Returns mock empty data for GET requests (empty arrays/objects)
- Returns mock success responses for POST/PUT/DELETE/PATCH requests
- No actual API calls are made in design mode
- No redirect to landing page
- All tabs accessible

### 4. Supabase Client (`lib/supabase/client-browser.ts`)
- Returns placeholder values if env vars missing
- Prevents crashes from missing configuration

## Implementation Details

### Middleware Bypass

```typescript
// middleware.ts
const isDesignMode = process.env.DESIGN_MODE === "1" || 
                     request.headers.get('host')?.includes('v0.dev')

if (isDesignMode) {
  return NextResponse.next() // Skip all auth
}
```

### Auth Provider Mock User

```typescript
// lib/auth-context.tsx
if (isDesignMode) {
  setUser({
    id: 'design-mode-user-id',
    email: 'design@example.com',
    // ... mock user object
  })
  setLoading(false)
  return
}
```

### Page Rendering

```typescript
// app/page.tsx
if (isDesignMode) {
  // Always show app UI, bypass auth check
  return <MobileLayout /> or <DesktopLayout />
}
```

## Usage in v0.dev

1. **Paste your app URL** into v0.dev
2. **Design Mode activates automatically** (detects v0.dev hostname)
3. **All app screens render** without authentication
4. **Edit and improve** your UI/UX
5. **Copy changes back** to your codebase

## Important Notes

### ⚠️ Security

- **Never commit `DESIGN_MODE=1`** to your repository
- **Never deploy** with `DESIGN_MODE=1` enabled
- Design Mode should **only** be used for local development or v0.dev previews

### ✅ Safe to Use

- ✅ Local development with `DESIGN_MODE=1` in `.env.local`
- ✅ v0.dev previews (automatic hostname detection)
- ✅ Design iteration and UI improvements

### ❌ Never Use In

- ❌ Production deployments
- ❌ Staging environments
- ❌ Any environment with real user data

## Testing

### Test Design Mode Locally

1. Add `DESIGN_MODE=1` to `.env.local`
2. Run `pnpm dev`
3. Visit `http://localhost:3000`
4. You should see the app UI without needing to sign in

### Test Normal Mode

1. Remove `DESIGN_MODE` from `.env.local` or set to `0`
2. Run `pnpm dev`
3. Visit `http://localhost:3000`
4. You should see the landing page (auth required)

## Troubleshooting

### App still shows landing page in v0.dev

- Check that `middleware.ts` has the hostname check
- Verify `app/page.tsx` checks for `v0.dev` hostname
- Clear browser cache and try again

### Supabase errors in v0.dev

- Design Mode should prevent these
- Check that `lib/supabase/client-browser.ts` handles missing env vars
- Verify `lib/auth-context.tsx` skips Supabase calls in design mode

### Components still trying to fetch data

- Components that directly call Supabase APIs may need design mode checks
- Consider creating a data layer that returns mock data in design mode
- See "Data Layer Pattern" below

## Data Layer Pattern (Optional)

For components that fetch data, create a data layer that returns mock data in design mode:

```typescript
// lib/data/storybooks.ts
export async function getStorybooks(userId?: string) {
  if (isDesignMode()) {
    return {
      storybooks: [
        { id: '1', title: 'Example Story', status: 'completed' },
        { id: '2', title: 'Another Story', status: 'generating' },
      ]
    }
  }
  
  // Normal Supabase query
  const supabase = createSupabaseServerClient()
  // ... fetch real data
}
```

## Files Modified

The following files have been updated to support Design Mode:

- `middleware.ts` - Bypasses auth when DESIGN_MODE=1 or v0.dev hostname
- `app/page.tsx` - Shows app UI in design mode
- `lib/auth-context.tsx` - Provides mock user in design mode
- `lib/supabase/client-browser.ts` - Handles missing env vars gracefully

## Reverting Changes

If you need to disable Design Mode:

1. Remove `DESIGN_MODE=1` from `.env.local`
2. Restart your dev server
3. All auth checks will work normally

Design Mode only activates when:
- `DESIGN_MODE=1` is set in environment, OR
- Hostname includes `v0.dev`

So removing the env var is sufficient to restore normal behavior.

