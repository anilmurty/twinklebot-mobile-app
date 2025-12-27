# Troubleshooting: Thumbnails Not Showing

## Quick Checklist

1. ✅ **Files uploaded to Supabase Storage?**
   - Check: Supabase Dashboard → Storage → story-template-assets → thumbnails/
   - Files should be:
     - `counting-adventure-1-10.jpg`
     - `alphabet-adventure-1-a-i.jpg`
     - `alphabet-adventure-2-j-r.jpg`
     - `alphabet-adventure-3-s-z.jpg`

2. ✅ **Bucket is Public?**
   - Check: Supabase Dashboard → Storage → story-template-assets → Settings
   - Must be set to **Public** (not Private)

3. ✅ **Database URLs Updated?**
   - Check: Run this query in Supabase SQL Editor:
     ```sql
     SELECT id, title, thumbnail_url FROM story_templates ORDER BY id;
     ```
   - URLs should look like: `https://xxx.supabase.co/storage/v1/object/public/story-template-assets/thumbnails/...`
   - If you see paths like `/counting-numbers-colorful-illustration.jpg`, the database needs updating

## Step-by-Step Fix

### Step 1: Verify Files Are Uploaded

1. Go to Supabase Dashboard → Storage
2. Navigate to `story-template-assets` bucket
3. Click into `thumbnails` folder
4. Verify all 4 files are there with correct names

**Common Issues:**
- Files uploaded to wrong folder (e.g., root of bucket instead of `thumbnails/`)
- Wrong file extensions (`.png` instead of `.jpg` - check the migration script)
- Typos in filenames

### Step 2: Verify Bucket is Public

1. Go to Supabase Dashboard → Storage
2. Click on `story-template-assets` bucket
3. Go to **Settings** tab
4. Ensure **Public bucket** is checked/enabled
5. If not public, enable it and save

### Step 3: Update Database URLs

Run this SQL script in Supabase SQL Editor:

```sql
-- Replace YOUR_PROJECT_REF with your actual Supabase project reference
-- Find it in: Dashboard → Settings → API → Project URL

UPDATE story_templates
SET thumbnail_url = 'https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public/story-template-assets/thumbnails/counting-adventure-1-10.jpg'
WHERE title = 'Counting Adventure';

UPDATE story_templates
SET thumbnail_url = 'https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public/story-template-assets/thumbnails/alphabet-adventure-1-a-i.jpg'
WHERE title = 'Alphabet Adventure 1';

UPDATE story_templates
SET thumbnail_url = 'https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public/story-template-assets/thumbnails/alphabet-adventure-2-j-r.jpg'
WHERE title = 'Alphabet Adventure 2';

UPDATE story_templates
SET thumbnail_url = 'https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public/story-template-assets/thumbnails/alphabet-adventure-3-s-z.jpg'
WHERE title = 'Alphabet Adventure 3';

-- Verify URLs were updated
SELECT id, title, thumbnail_url FROM story_templates ORDER BY id;
```

**Important:** Replace `YOUR_PROJECT_REF` with your actual project reference (e.g., `cxwiutrjgftozbfpnpvv`)

### Step 4: Check File Extensions Match

If your files are `.png` instead of `.jpg`, update the SQL script accordingly:

```sql
-- If files are PNG, use .png extension:
UPDATE story_templates
SET thumbnail_url = 'https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public/story-template-assets/thumbnails/counting-adventure-1-10.png'
WHERE title = 'Counting Adventure';
-- ... etc
```

### Step 5: Test the URLs Directly

Copy one of the URLs from the database and paste it directly in your browser. It should show the image.

If you get a 404:
- Check the filename matches exactly (case-sensitive)
- Check the file is in the `thumbnails/` folder, not root
- Verify the bucket name is exactly `story-template-assets`

If you get a 403 (Forbidden):
- The bucket is not public - enable public access

### Step 6: Check Browser Console

1. Open your app in browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Look for errors related to images
5. Go to Network tab
6. Filter by "Img" or "jpg"
7. Check if image requests are failing (404, 403, etc.)

### Step 7: Check API Response

Test the API endpoint directly:

```bash
curl http://localhost:3000/api/v1/story-templates
```

Or visit: `http://localhost:3000/api/v1/story-templates`

Check the `thumbnail_url` values in the response. They should be full Supabase URLs.

## Common Error Messages

### "Template X has placeholder thumbnail URL"
- **Fix:** Database still has placeholder paths. Run the SQL update script.

### "Could not extract path from thumbnail URL"
- **Fix:** URL format is incorrect. Ensure it includes `/object/public/` or is a valid Supabase URL.

### "Failed to generate signed URL"
- **Fix:** Bucket might be private. Either make it public OR ensure signed URL generation works (check service role key).

### 404 Not Found
- **Fix:** 
  - Check filename matches exactly (case-sensitive)
  - Check file is in correct folder (`thumbnails/`)
  - Verify project reference in URL matches your project

### 403 Forbidden
- **Fix:** Bucket is not public. Enable public access in bucket settings.

## Still Not Working?

1. Check server logs for detailed error messages
2. Verify environment variables are set correctly
3. Try accessing a thumbnail URL directly in browser
4. Check if CORS is blocking requests (unlikely for public buckets)

