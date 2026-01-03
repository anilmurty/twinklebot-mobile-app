# Supabase Storage Buckets Setup

## Required Buckets

The application requires the following storage buckets in Supabase:

### 1. `character-photos` (already exists)
- **Purpose**: Stores user-uploaded character photos
- **Privacy**: Private (requires authentication)
- **Path structure**: `{userId}/{characterId}/front.jpg`

### 2. `character-variations` (NEW - needs to be created)
- **Purpose**: Stores generated character variations (front/left/right views)
- **Privacy**: Private (requires authentication)
- **Path structure**: `{userId}/{characterId}/{templateId}/front.jpg` (and left.jpg, right.jpg)

### 3. `storybook-scenes` (already exists)
- **Purpose**: Stores generated storybook scene images
- **Privacy**: Private (requires authentication)
- **Path structure**: `{storybookId}/scene-{number}.jpg`

## How to Create Buckets in Supabase

1. Go to **Supabase Dashboard** → Your Project
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"** or **"Create bucket"**
4. For `character-variations`:
   - **Name**: `character-variations`
   - **Public bucket**: ❌ Unchecked (Private)
   - Click **"Create bucket"**

## Bucket Policies

The buckets should have RLS (Row Level Security) policies that allow:
- Users to upload their own files
- Users to read their own files
- Service role to read/write all files (for server-side operations)

These policies are typically set up automatically, but you can verify them in:
**Storage** → **Policies** → Select the bucket

## Verification

After creating the buckets, you can verify they exist by:
1. Going to **Storage** → You should see all three buckets listed
2. Or check via API: The app will throw clear error messages if buckets are missing
