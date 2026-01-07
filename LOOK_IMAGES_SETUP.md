# Look Images Setup Guide

## Storage Location

**Bucket**: `story-template-assets` (same bucket used for story template base photos and thumbnails)

**Path Structure**: `day-at-the-zoo/looks/`

## Recommended Folder Structure

```
story-template-assets/
└── day-at-the-zoo/
    └── looks/
        ├── boy-model-1.jpg      (Model image shown in UI)
        ├── boy-model-2.jpg
        ├── boy-model-3.jpg
        ├── boy-attire-1.jpg     (Attire image sent to Replicate)
        ├── boy-attire-2.jpg
        ├── boy-attire-3.jpg
        ├── girl-model-1.jpg     (Model image shown in UI)
        ├── girl-model-2.jpg
        ├── girl-model-3.jpg
        ├── girl-attire-1.jpg    (Attire image sent to Replicate)
        ├── girl-attire-2.jpg
        └── girl-attire-3.jpg
```

## File Naming Convention

You can use any naming convention you prefer, but here's a suggested format:

**Model Images** (shown to users):
- `boy-model-1.jpg`, `boy-model-2.jpg`, `boy-model-3.jpg`
- `girl-model-1.jpg`, `girl-model-2.jpg`, `girl-model-3.jpg`

**Attire Images** (sent to Replicate):
- `boy-attire-1.jpg`, `boy-attire-2.jpg`, `boy-attire-3.jpg`
- `girl-attire-1.jpg`, `girl-attire-2.jpg`, `girl-attire-3.jpg`

**Alternative naming** (if you have specific look names):
- `boy-safari-explorer-model.jpg` / `boy-safari-explorer-attire.jpg`
- `boy-zoo-keeper-model.jpg` / `boy-zoo-keeper-attire.jpg`
- `boy-animal-lover-model.jpg` / `boy-animal-lover-attire.jpg`
- (same for girls)

## Steps to Upload

1. **Go to Supabase Dashboard** → **Storage**
2. **Navigate to** `story-template-assets` bucket
3. **Create folder** `day-at-the-zoo/looks/` (if it doesn't exist)
4. **Upload all 12 images** to this folder:
   - 3 boy model images
   - 3 boy attire images
   - 3 girl model images
   - 3 girl attire images

## Important Notes

- ✅ **Bucket must be Public** - The `story-template-assets` bucket should already be public (check Settings)
- ✅ **File format** - JPEG or PNG (JPEG recommended for smaller file sizes)
- ✅ **Image quality** - Use high quality images for best results with Replicate
- ✅ **File paths** - After uploading, note the exact filenames you used

## What Happens Next

Once you upload the images, provide me with:
1. **The exact filenames** you used for each image
2. **The look names** for each of the 3 looks (e.g., "Safari Explorer", "Zoo Keeper", "Animal Lover")
3. **The prompt modifiers** for each look (the custom prompt text to dress the child)

I'll then create the migration script `027_seed_day_at_zoo_looks.sql` that:
- Inserts all 6 looks (3 boy + 3 girl) into the `character_looks` table
- Sets `reference_image_url` to the model image paths
- Sets `attire_image_url` to the attire image paths
- Sets `prompt_modifier` to your custom prompts
- Links them to the "Day at the Zoo" template (template_id = 1, assuming that's the ID)

## Example Database Values

After migration, the database will store paths like:
- `reference_image_url`: `day-at-the-zoo/looks/boy-model-1.jpg`
- `attire_image_url`: `day-at-the-zoo/looks/boy-attire-1.jpg`

The code will automatically convert these to full Supabase Storage URLs when needed.

