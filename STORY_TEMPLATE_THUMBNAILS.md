# Story Template Thumbnails Setup Guide

## Overview

Story templates need thumbnail images to display in the Story Library. These images are stored in Supabase Storage and referenced in the `story_templates` table.

## Image Type

Each story template has **one** image field:
- **`thumbnail_url`**: Small preview image used in the Story Library list view

## Image Specifications

### Display Size
Thumbnails are displayed at **96px × 128px** (3:4 aspect ratio) in the Story Library.

### Recommended Image Dimensions
For best quality on all devices (including high-DPI/retina displays):

- **Minimum resolution**: 192px × 256px (2x display size)
- **Optimal resolution**: 384px × 512px (4x display size for future-proofing)
- **Aspect ratio**: 3:4 (portrait orientation)
- **File format**: JPEG (for photos/illustrations) or PNG (if transparency needed)
- **File size**: Aim for < 50KB per image (optimize for web)

### Why Higher Resolution?
Even though thumbnails display at 96×128px, providing higher resolution images ensures:
- Sharp display on retina/high-DPI screens (2x, 3x pixel density)
- Future flexibility if display size increases
- Better quality when images are viewed in other contexts

### Image Optimization Tips
1. Use image compression tools (e.g., TinyPNG, ImageOptim, Squoosh)
2. Save as progressive JPEG for better loading experience
3. Ensure images are properly cropped to 3:4 aspect ratio
4. Test on both standard and retina displays

## Current Status

The database currently has placeholder paths (like `/counting-numbers-colorful-illustration.jpg`) instead of actual Supabase Storage URLs. These need to be replaced with real image URLs.

## Steps to Fix

### 1. Create Supabase Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Create a new bucket called `story-template-assets`
3. Set it as **Public** (so images can be accessed without authentication)
4. Create the following folder structure:
   ```
   story-template-assets/
   └── thumbnails/
       ├── counting-adventure-1-10.jpg (Counting Adventure)
       ├── alphabet-adventure-1-a-i.jpg (Alphabet Adventure 1)
       ├── alphabet-adventure-2-j-r.jpg (Alphabet Adventure 2)
       └── alphabet-adventure-3-s-z.jpg (Alphabet Adventure 3)
   ```

### 2. Upload Thumbnail Images

For each template, you need to create and upload:
- **Thumbnail**: A small preview image (recommended: 200x300px or similar aspect ratio)

**Template IDs:**
- Template 1: Counting Adventure (1-10)
- Template 2: Alphabet Adventure 1 (A-I)
- Template 3: Alphabet Adventure 2 (J-R)
- Template 4: Alphabet Adventure 3 (S-Z)

### 3. Get Public URLs

After uploading, get the public URLs from Supabase Storage. They should look like:
```
https://{project_ref}.supabase.co/storage/v1/object/public/story-template-assets/thumbnails/counting-adventure-1-10.jpg
https://{project_ref}.supabase.co/storage/v1/object/public/story-template-assets/thumbnails/alphabet-adventure-1-a-i.jpg
https://{project_ref}.supabase.co/storage/v1/object/public/story-template-assets/thumbnails/alphabet-adventure-2-j-r.jpg
https://{project_ref}.supabase.co/storage/v1/object/public/story-template-assets/thumbnails/alphabet-adventure-3-s-z.jpg
```

### 4. Update Database URLs

Run the migration script `db_scripts/004_update_template_storage_urls.sql` after updating it with your actual Supabase project reference:

```sql
-- Update the project reference in the script
supabase_storage_base_url := 'https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public/story-template-assets';
```

Then run the migration in your Supabase SQL Editor.

### 5. Verify

After updating, check that:
1. The API endpoint `/api/v1/story-templates` returns valid URLs
2. The Story Library tab displays the thumbnails correctly
3. Images load without errors

## Alternative: Use Placeholder Images

If you don't have custom thumbnails yet, you can:
1. Use placeholder images from a service like `https://via.placeholder.com/200x300`
2. Or use the fallback placeholder that's already in the code (`/placeholder.svg`)

The frontend will show a placeholder icon if thumbnails are missing.

## Troubleshooting

### Images not showing?
1. Check browser console for 404 errors
2. Verify the bucket is set to **Public**
3. Check that URLs in database match actual file paths in Storage
4. Verify the bucket name is exactly `story-template-assets` (case-sensitive)

### Getting signed URL errors?
- If the bucket is public, URLs should work directly without signed URLs
- Check that the bucket exists and has the correct folder structure

### Database has placeholder paths?
- Run migration `004_update_template_storage_urls.sql` after uploading images
- Make sure to update the project reference in the script

