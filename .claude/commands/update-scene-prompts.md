Update scene insertion prompts from an Excel spreadsheet. Takes an optional spreadsheet file path as input (defaults to `docs/Replicate_Nano_Banana_Scene_prompts_-_apr-5-2026.xlsx`).

Arguments: $ARGUMENTS (format: `/path/to/spreadsheet.xlsx`, optional — defaults to `docs/Replicate_Nano_Banana_Scene_prompts_-_apr-5-2026.xlsx`)

## Spreadsheet Format

The spreadsheet has one tab per story template. Each tab contains:

| Column | Content |
|--------|---------|
| A | Scene number |
| B | Scene headline |
| C | Script text (displayed to user in app) |
| D | Character insertion prompt (used for image generation) |
| E | Base scene generation prompt (used to pre-generate background scenes) |

Header row uses "Scene number" or "Scene" for column A. Data starts on the row after the header.

## Step 1 — Parse the spreadsheet

Use Python with openpyxl to read all tabs and extract scene data:

```python
import openpyxl
import json

wb = openpyxl.load_workbook('<spreadsheet_path>', data_only=True)
all_stories = {}

for sheet_name in wb.sheetnames:
    ws = wb[sheet_name]
    rows = list(ws.iter_rows(values_only=True))

    # Find header row (contains "Scene" in first column)
    header_idx = None
    for i, row in enumerate(rows):
        if row[0] and str(row[0]).strip().lower().startswith('scene'):
            header_idx = i
            break

    if header_idx is None:
        continue

    scenes = []
    for row in rows[header_idx + 1:]:
        scene_num = row[0]
        if scene_num is None:
            break
        scenes.append({
            'scene_number': int(scene_num),
            'headline': str(row[1] or '').strip(),
            'script_text': str(row[2] or '').strip(),
            'insertion_prompt': str(row[3] or '').strip(),
            'base_scene_prompt': str(row[4] or '').strip() if len(row) > 4 else ''
        })

    if scenes:
        all_stories[sheet_name] = scenes

# Save parsed data
with open('/tmp/story_prompts.json', 'w') as f:
    json.dump(all_stories, f, indent=2)

# Print summary
for name, scenes in all_stories.items():
    print(f"{name}: {len(scenes)} scenes")
print(f"\nTotal: {len(all_stories)} stories, {sum(len(s) for s in all_stories.values())} scenes")
```

## Step 2 — Verify tab-to-template title mapping

Tab names in the spreadsheet may not exactly match `title` in the `story_templates` table. Check by listing all template titles from the database and mapping manually. Common differences:
- Apostrophes: "Farmers Market" → "Farmer's Market"
- Abbreviations or spacing differences

## Step 3 — Generate SQL migration

**Always run `ls db_scripts/*.sql | tail -5` to get the current highest migration number.**

Generate a SQL migration file `db_scripts/NNN_description.sql` with one `DO $$ ... $$;` block per template. Each block:

1. Finds the template by title (exact match OR ILIKE fallback)
2. Gets the current `script_data->'scenes'` JSONB array
3. **Guards against NULL**: `IF v_scenes IS NULL OR jsonb_array_length(v_scenes) = 0 THEN RETURN; END IF;`
4. Loops through scenes, matching by `scene_number`
5. Uses `jsonb_set` to update `insertion_prompt` for each matched scene
6. Writes back the updated scenes array

Important SQL notes:
- Single quotes in prompt text must be doubled: `'` → `''`
- JSON string values need outer double quotes: `'"prompt text here"'::JSONB`
- Remove any gendered language (child/boy/girl → "character")

## Step 4 — Run migration

Provide the SQL to the user to run in the Supabase SQL editor. The migration is idempotent — safe to re-run.

## Step 5 — Verify

After running, spot-check a few templates:

```sql
SELECT title,
       scene->>'scene_number' as scene_num,
       scene->>'insertion_prompt' as prompt
FROM story_templates,
     jsonb_array_elements(script_data->'scenes') as scene
WHERE title = '<template_title>'
ORDER BY (scene->>'scene_number')::int;
```
