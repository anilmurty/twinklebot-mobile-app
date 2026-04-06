-- Migration: Update per-scene insertion_prompt from spreadsheet
-- Source: Replicate_Nano_Banana_Scene_prompts_-_UPDATED.xlsx
-- Date: 2026-04-05
-- Removes gendered language, makes prompts scene-specific

-- This script updates script_data.scenes[].insertion_prompt for each template
-- by matching scene_number within the JSON array.

-- Template: Day at the Zoo (10 scenes)
DO $$
DECLARE
  v_template_id INTEGER;
  v_scenes JSONB;
  v_updated_scenes JSONB := '[]'::JSONB;
  v_scene JSONB;
  v_idx INTEGER;
BEGIN
  -- Find template (try exact match, then ILIKE)
  SELECT id INTO v_template_id FROM story_templates
    WHERE title = 'Day at the Zoo' OR title ILIKE '%Day at the Zoo%'
    LIMIT 1;

  IF v_template_id IS NULL THEN
    RAISE NOTICE 'Template not found: Day at the Zoo';
    RETURN;
  END IF;

  -- Get current scenes
  SELECT script_data->'scenes' INTO v_scenes FROM story_templates WHERE id = v_template_id;

  IF v_scenes IS NULL OR jsonb_array_length(v_scenes) = 0 THEN
    RAISE NOTICE 'No scenes found for template id %', v_template_id;
    RETURN;
  END IF;

  -- Update each scene's insertion_prompt
  FOR v_idx IN 0..jsonb_array_length(v_scenes) - 1 LOOP
    v_scene := v_scenes->v_idx;
    CASE (v_scene->>'scene_number')::INTEGER
      WHEN 1 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"put the character in the photo, clutching an open paper map with an expression of amazement and curiosity for what''s ahead. make height proportionate to surroundings and the character should blend into the rest of the photo as if the photo was taken with them in it. keep everything else the same and make it look natural"'::JSONB);
      WHEN 2 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"put the character in the photo, excited and animated. The character should blend into the rest of the photo as if the photo was taken with them in it. keep everything else the same and make it look natural"'::JSONB);
      WHEN 3 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"put the character in the photo, standing on the platform and behind the fence, feeding the giraffe lettuce, expression of excitement and amazement. The character should blend into the rest of the photo as if the photo was taken with them in it. keep everything else the same and make it natural"'::JSONB);
      WHEN 4 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"put the character in the photo looking at the turtle and in amazement. make it look natural as if the photo was taken with the character in it. keep everything else the same and make it natural"'::JSONB);
      WHEN 5 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"put the character in the photo, sitting and sipping a juice box and holding a teddy bear shaped sandwich as if they''''re posing for a photo. The character should blend into the rest of the photo as if the photo was taken with them in it. keep everything else the same and make it look natural"'::JSONB);
      WHEN 6 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"put the character in the photo sitting on the bench facing outward, sitting next to the backpack. keep everything else the same and make it look natural"'::JSONB);
      WHEN 7 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"put the character in the photo, on their knees and gently petting the goat with their right hand while feeding the goat grains with their left hand. expression of quiet observation. The character should blend into the rest of the photo as if the photo was taken with them in it. keep everything else the same and make it look natural"'::JSONB);
      WHEN 8 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"put the character in the photo, standing firmly on the ground and amazed by all the butterflies around. make it look natural as if the photo was taken with the character in it"'::JSONB);
      WHEN 9 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"add the character, hugging a penguin stuffed toy like the ones on the shelf affectionately with touching it with their face. keep evetyhing else the same make it look natunal as if the photo was taken with the character in it"'::JSONB);
      WHEN 10 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"put the character in the photo, they should be walking out after a long day, tired but smiling and with an icecream in the character''s hand. keep everything else the same and make it look natural"'::JSONB);
      ELSE NULL; -- leave unknown scenes unchanged
    END CASE;
    v_updated_scenes := v_updated_scenes || v_scene;
  END LOOP;

  -- Write back
  UPDATE story_templates
    SET script_data = jsonb_set(script_data, '{scenes}', v_updated_scenes)
    WHERE id = v_template_id;

  RAISE NOTICE 'Updated template % (id=%)', 'Day at the Zoo', v_template_id;
END $$;

-- Template: Counting (1-10) (10 scenes)
DO $$
DECLARE
  v_template_id INTEGER;
  v_scenes JSONB;
  v_updated_scenes JSONB := '[]'::JSONB;
  v_scene JSONB;
  v_idx INTEGER;
BEGIN
  -- Find template (try exact match, then ILIKE)
  SELECT id INTO v_template_id FROM story_templates
    WHERE title = 'Counting (1-10)' OR title ILIKE '%Counting (1-10)%'
    LIMIT 1;

  IF v_template_id IS NULL THEN
    RAISE NOTICE 'Template not found: Counting (1-10)';
    RETURN;
  END IF;

  -- Get current scenes
  SELECT script_data->'scenes' INTO v_scenes FROM story_templates WHERE id = v_template_id;

  IF v_scenes IS NULL OR jsonb_array_length(v_scenes) = 0 THEN
    RAISE NOTICE 'No scenes found for template id %', v_template_id;
    RETURN;
  END IF;

  -- Update each scene's insertion_prompt
  FOR v_idx IN 0..jsonb_array_length(v_scenes) - 1 LOOP
    v_scene := v_scenes->v_idx;
    CASE (v_scene->>'scene_number')::INTEGER
      WHEN 1 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"put the character in the photo, putting on a hat while smiling and looking at themselves in the mirror. keep everything else the same"'::JSONB);
      WHEN 2 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"put the character in photo, sitting on the bench with left foot on the bench and trying to wear a shoe that pairs with the shoe that is on the floor. keep everything else the same"'::JSONB);
      WHEN 3 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"Add the character to the photo, standing on a chair, looking at the apples, pointing with one hand and gesturing with the other hand like counting the apples. keep everything else the same"'::JSONB);
      WHEN 4 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"put the character in the room sitting next to the stacked blocks and gesturing like they just stacked them. keep everything else the same"'::JSONB);
      WHEN 5 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"put the character in photo standing with left arm in the air andpalm wide open so that all fingers are clearly visible. Right arm normally to their side. keep everything else the same"'::JSONB);
      WHEN 6 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"put the character in the photo, sitting on the bed, legs crossed, gesturing like they''re sorting the socks. keep everything else the same"'::JSONB);
      WHEN 7 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"put the character in the photo, standing and looking up and gesturing like they''re counting the stairs. keep everything else the same"'::JSONB);
      WHEN 8 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"put the character in the photo, sitting on the stool and counting the spoons. keep everything else the same"'::JSONB);
      WHEN 9 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"put the character in the photo, standing and counting the picture frames. keep everything else the same"'::JSONB);
      WHEN 10 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"put the character in the photo, snuggled into the blanket but face visible. keep everything else the same"'::JSONB);
      ELSE NULL; -- leave unknown scenes unchanged
    END CASE;
    v_updated_scenes := v_updated_scenes || v_scene;
  END LOOP;

  -- Write back
  UPDATE story_templates
    SET script_data = jsonb_set(script_data, '{scenes}', v_updated_scenes)
    WHERE id = v_template_id;

  RAISE NOTICE 'Updated template % (id=%)', 'Counting (1-10)', v_template_id;
END $$;

-- Template: Alphabet (A - I) (9 scenes)
DO $$
DECLARE
  v_template_id INTEGER;
  v_scenes JSONB;
  v_updated_scenes JSONB := '[]'::JSONB;
  v_scene JSONB;
  v_idx INTEGER;
BEGIN
  -- Find template (try exact match, then ILIKE)
  SELECT id INTO v_template_id FROM story_templates
    WHERE title = 'Alphabet (A - I)' OR title ILIKE '%Alphabet (A - I)%'
    LIMIT 1;

  IF v_template_id IS NULL THEN
    RAISE NOTICE 'Template not found: Alphabet (A - I)';
    RETURN;
  END IF;

  -- Get current scenes
  SELECT script_data->'scenes' INTO v_scenes FROM story_templates WHERE id = v_template_id;

  IF v_scenes IS NULL OR jsonb_array_length(v_scenes) = 0 THEN
    RAISE NOTICE 'No scenes found for template id %', v_template_id;
    RETURN;
  END IF;

  -- Update each scene's insertion_prompt
  FOR v_idx IN 0..jsonb_array_length(v_scenes) - 1 LOOP
    v_scene := v_scenes->v_idx;
    CASE (v_scene->>'scene_number')::INTEGER
      WHEN 1 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the airplane photo with the character in the white background. Match the pose of the character in the airplane photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 2 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the bus photo with the character in the white background. Match the pose of the character in the bus photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 3 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the cloud photo with the character in the white background. Match the pose of the character in the cloud photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 4 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the dog photo with the character in the white background. Match the pose of the character in the dog photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 5 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the excavator photo with the character in the white background. Match the pose of the character in the excavator photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 6 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the fountain photo with the character in the white background. Match the pose of the character in the fountain photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 7 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the goose photo with the character in the white background. Match the pose of the character in the goose photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 8 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the helicopter photo with the character in the white background. Match the pose of the character in the helicopter photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 9 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the icecream photo with the character in the white background. match the pose of the character in the icecream photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      ELSE NULL; -- leave unknown scenes unchanged
    END CASE;
    v_updated_scenes := v_updated_scenes || v_scene;
  END LOOP;

  -- Write back
  UPDATE story_templates
    SET script_data = jsonb_set(script_data, '{scenes}', v_updated_scenes)
    WHERE id = v_template_id;

  RAISE NOTICE 'Updated template % (id=%)', 'Alphabet (A - I)', v_template_id;
END $$;

-- Template: Alphabet (J-R) (9 scenes)
DO $$
DECLARE
  v_template_id INTEGER;
  v_scenes JSONB;
  v_updated_scenes JSONB := '[]'::JSONB;
  v_scene JSONB;
  v_idx INTEGER;
BEGIN
  -- Find template (try exact match, then ILIKE)
  SELECT id INTO v_template_id FROM story_templates
    WHERE title = 'Alphabet (J-R)' OR title ILIKE '%Alphabet (J-R)%'
    LIMIT 1;

  IF v_template_id IS NULL THEN
    RAISE NOTICE 'Template not found: Alphabet (J-R)';
    RETURN;
  END IF;

  -- Get current scenes
  SELECT script_data->'scenes' INTO v_scenes FROM story_templates WHERE id = v_template_id;

  IF v_scenes IS NULL OR jsonb_array_length(v_scenes) = 0 THEN
    RAISE NOTICE 'No scenes found for template id %', v_template_id;
    RETURN;
  END IF;

  -- Update each scene's insertion_prompt
  FOR v_idx IN 0..jsonb_array_length(v_scenes) - 1 LOOP
    v_scene := v_scenes->v_idx;
    CASE (v_scene->>'scene_number')::INTEGER
      WHEN 1 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the jam photo with the character in the white background. Match the pose of the character in the jam photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 2 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the kite photo with the character in the white background. Match the pose of the character in the kite photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 3 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the leaf photo with the character in the white background. Match the pose of the character in the leaf photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 4 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the moon photo with the character in the white background. Match the pose of the character in the moon photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 5 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the nest photo with the character in the white background. Match the pose of the character in the nest photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 6 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the cone photo with the character in the white background. Match the pose of the character in the cone photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 7 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the puddle photo with the character in the white background. Match the pose of the character in the puddle photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 8 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the quilt photo with the character in the white background. Match the pose of the character in the quilt photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 9 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the car photo with the character in the white background. Match the pose of the character in the car photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      ELSE NULL; -- leave unknown scenes unchanged
    END CASE;
    v_updated_scenes := v_updated_scenes || v_scene;
  END LOOP;

  -- Write back
  UPDATE story_templates
    SET script_data = jsonb_set(script_data, '{scenes}', v_updated_scenes)
    WHERE id = v_template_id;

  RAISE NOTICE 'Updated template % (id=%)', 'Alphabet (J-R)', v_template_id;
END $$;

-- Template: Alphabet (S-Z) (8 scenes)
DO $$
DECLARE
  v_template_id INTEGER;
  v_scenes JSONB;
  v_updated_scenes JSONB := '[]'::JSONB;
  v_scene JSONB;
  v_idx INTEGER;
BEGIN
  -- Find template (try exact match, then ILIKE)
  SELECT id INTO v_template_id FROM story_templates
    WHERE title = 'Alphabet (S-Z)' OR title ILIKE '%Alphabet (S-Z)%'
    LIMIT 1;

  IF v_template_id IS NULL THEN
    RAISE NOTICE 'Template not found: Alphabet (S-Z)';
    RETURN;
  END IF;

  -- Get current scenes
  SELECT script_data->'scenes' INTO v_scenes FROM story_templates WHERE id = v_template_id;

  IF v_scenes IS NULL OR jsonb_array_length(v_scenes) = 0 THEN
    RAISE NOTICE 'No scenes found for template id %', v_template_id;
    RETURN;
  END IF;

  -- Update each scene's insertion_prompt
  FOR v_idx IN 0..jsonb_array_length(v_scenes) - 1 LOOP
    v_scene := v_scenes->v_idx;
    CASE (v_scene->>'scene_number')::INTEGER
      WHEN 1 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the sun photo with the character in the white background. Match the pose of the character in the sun photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 2 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the tree photo with the character in the white background. Match the pose of the character in the tree photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 3 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the umbrella photo with the character in the white background. Match the pose of the character in the umbrella photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 4 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the van photo with the character in the white background. Match the pose of the character in the van photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 5 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the windmill photo with the character in the white background. Match the pose of the character in the windmill photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 6 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the xylophone photo with the character in the white background. Match the pose of the character in the xylophone photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 7 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the yard photo with the character in the white background. Match the pose of the character in the yard photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 8 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the zoo photo with the character in the white background. Match the pose of the character in the zoo photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      ELSE NULL; -- leave unknown scenes unchanged
    END CASE;
    v_updated_scenes := v_updated_scenes || v_scene;
  END LOOP;

  -- Write back
  UPDATE story_templates
    SET script_data = jsonb_set(script_data, '{scenes}', v_updated_scenes)
    WHERE id = v_template_id;

  RAISE NOTICE 'Updated template % (id=%)', 'Alphabet (S-Z)', v_template_id;
END $$;

-- Template: Dream Mission to the Moon (10 scenes)
DO $$
DECLARE
  v_template_id INTEGER;
  v_scenes JSONB;
  v_updated_scenes JSONB := '[]'::JSONB;
  v_scene JSONB;
  v_idx INTEGER;
BEGIN
  -- Find template (try exact match, then ILIKE)
  SELECT id INTO v_template_id FROM story_templates
    WHERE title = 'Dream Mission to the Moon' OR title ILIKE '%Dream Mission to the Moon%'
    LIMIT 1;

  IF v_template_id IS NULL THEN
    RAISE NOTICE 'Template not found: Dream Mission to the Moon';
    RETURN;
  END IF;

  -- Get current scenes
  SELECT script_data->'scenes' INTO v_scenes FROM story_templates WHERE id = v_template_id;

  IF v_scenes IS NULL OR jsonb_array_length(v_scenes) = 0 THEN
    RAISE NOTICE 'No scenes found for template id %', v_template_id;
    RETURN;
  END IF;

  -- Update each scene's insertion_prompt
  FOR v_idx IN 0..jsonb_array_length(v_scenes) - 1 LOOP
    v_scene := v_scenes->v_idx;
    CASE (v_scene->>'scene_number')::INTEGER
      WHEN 1 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the window photo with the character in the white background. Match the pose and attire of the character in the window photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 2 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the space center photo with the character in the white background, including the space suit. Match the pose of the character in the space center photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 3 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the spacesuit photo with the character in the white background,  including the space suit. Match the pose of the character in the spacesuit photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 4 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the rocket seat photo with the character in the white background,  including the space suit. Match the pose of the character in the rocket seat photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 5 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the launch photo with the character in the white background,  including the space suit. Match the pose of the character in the launch photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 6 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the floating photo with the character in the white background,  including the space suit. Match the pose of the character in the floating photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 7 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the moon landing photo with the character in the white background,  including the space suit. Match the pose of the character in the moon landing photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 8 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the moon hopping photo with the character in the white background,  including the space suit. Match the pose of the character in the moon hopping photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 9 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the moon launch photo with the character in the white background,  including the space suit. Match the pose of the character in the moon launch photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 10 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the waking up photo with the character in the white background. Match the pose and attire of the character in the waking up photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      ELSE NULL; -- leave unknown scenes unchanged
    END CASE;
    v_updated_scenes := v_updated_scenes || v_scene;
  END LOOP;

  -- Write back
  UPDATE story_templates
    SET script_data = jsonb_set(script_data, '{scenes}', v_updated_scenes)
    WHERE id = v_template_id;

  RAISE NOTICE 'Updated template % (id=%)', 'Dream Mission to the Moon', v_template_id;
END $$;

-- Template: Day at the Fire Station (10 scenes)
DO $$
DECLARE
  v_template_id INTEGER;
  v_scenes JSONB;
  v_updated_scenes JSONB := '[]'::JSONB;
  v_scene JSONB;
  v_idx INTEGER;
BEGIN
  -- Find template (try exact match, then ILIKE)
  SELECT id INTO v_template_id FROM story_templates
    WHERE title = 'Day at the Fire Station' OR title ILIKE '%Day at the Fire Station%'
    LIMIT 1;

  IF v_template_id IS NULL THEN
    RAISE NOTICE 'Template not found: Day at the Fire Station';
    RETURN;
  END IF;

  -- Get current scenes
  SELECT script_data->'scenes' INTO v_scenes FROM story_templates WHERE id = v_template_id;

  IF v_scenes IS NULL OR jsonb_array_length(v_scenes) = 0 THEN
    RAISE NOTICE 'No scenes found for template id %', v_template_id;
    RETURN;
  END IF;

  -- Update each scene's insertion_prompt
  FOR v_idx IN 0..jsonb_array_length(v_scenes) - 1 LOOP
    v_scene := v_scenes->v_idx;
    CASE (v_scene->>'scene_number')::INTEGER
      WHEN 1 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the fire station exterior photo with the character in the white background. Match the pose of the character in the exterior photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 2 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the gear wall photo with the character in the white background. Match the pose of the character in the gear wall photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 3 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the fire truck photo with the character in the white background. Match the pose of the character standing beside the fire truck. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 4 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the gear try-on photo with the character in the white background. Match the pose and firefighter gear of the character in the try-on photo. make it look like it was taken with the character from the white background photo. the character must be wearing the full oversized firefighter gear"'::JSONB);
      WHEN 5 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the fire truck cab photo with the character in the white background. Match the pose of the character sitting in the fire truck cab. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 6 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the pole photo with the character in the white background. Match the pose of the character holding the brass pole. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 7 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the alarm scene photo with the character in the white background. Match the pose of the character watching the alarm scene. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 8 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the stop drop roll photo with the character in the white background. Match the pose of the character practicing stop drop roll. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 9 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the training house photo with the character in the white background. Match the pose of the character in front of the training house. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 10 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the badge ceremony photo with the character in the white background. Match the pose of the character receiving the badge. make it look like it was taken with the character from the white background photo"'::JSONB);
      ELSE NULL; -- leave unknown scenes unchanged
    END CASE;
    v_updated_scenes := v_updated_scenes || v_scene;
  END LOOP;

  -- Write back
  UPDATE story_templates
    SET script_data = jsonb_set(script_data, '{scenes}', v_updated_scenes)
    WHERE id = v_template_id;

  RAISE NOTICE 'Updated template % (id=%)', 'Day at the Fire Station', v_template_id;
END $$;

-- Template: Farmer's Market (10 scenes)
DO $$
DECLARE
  v_template_id INTEGER;
  v_scenes JSONB;
  v_updated_scenes JSONB := '[]'::JSONB;
  v_scene JSONB;
  v_idx INTEGER;
BEGIN
  -- Find template (try exact match, then ILIKE)
  SELECT id INTO v_template_id FROM story_templates
    WHERE title = 'Farmer''s Market' OR title ILIKE '%Farmer''s Market%'
    LIMIT 1;

  IF v_template_id IS NULL THEN
    RAISE NOTICE 'Template not found: Farmer''s Market';
    RETURN;
  END IF;

  -- Get current scenes
  SELECT script_data->'scenes' INTO v_scenes FROM story_templates WHERE id = v_template_id;

  IF v_scenes IS NULL OR jsonb_array_length(v_scenes) = 0 THEN
    RAISE NOTICE 'No scenes found for template id %', v_template_id;
    RETURN;
  END IF;

  -- Update each scene's insertion_prompt
  FOR v_idx IN 0..jsonb_array_length(v_scenes) - 1 LOOP
    v_scene := v_scenes->v_idx;
    CASE (v_scene->>'scene_number')::INTEGER
      WHEN 1 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the market entrance photo with the character in the white background. Match the pose of the character in the market entrance photo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 2 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the apple stall photo with the character in the white background. Match the pose of the character at the apple stall. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 3 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the vegetable stall photo with the character in the white background. Match the pose of the character at the vegetable stall. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 4 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the pepper sorting photo with the character in the white background. Match the pose of the character sorting peppers. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 5 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the market purchase photo with the character in the white background. Match the pose of the character at the market purchase. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 6 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the berry stall photo with the character in the white background. Match the pose of the character filling the strawberry tray. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 7 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the bread stall photo with the character in the white background. Match the pose of the character at the bread stall. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 8 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the scale photo with the character in the white background. Match the pose of the character at the balance scale. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 9 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the tomato stall photo with the character in the white background. Match the pose of the character at the tomato stall. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 10 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the market end photo with the character in the white background. Match the pose of the character with the full basket. make it look like it was taken with the character from the white background photo"'::JSONB);
      ELSE NULL; -- leave unknown scenes unchanged
    END CASE;
    v_updated_scenes := v_updated_scenes || v_scene;
  END LOOP;

  -- Write back
  UPDATE story_templates
    SET script_data = jsonb_set(script_data, '{scenes}', v_updated_scenes)
    WHERE id = v_template_id;

  RAISE NOTICE 'Updated template % (id=%)', 'Farmer''s Market', v_template_id;
END $$;

-- Template: How a Volcano Works (10 scenes)
DO $$
DECLARE
  v_template_id INTEGER;
  v_scenes JSONB;
  v_updated_scenes JSONB := '[]'::JSONB;
  v_scene JSONB;
  v_idx INTEGER;
BEGIN
  -- Find template (try exact match, then ILIKE)
  SELECT id INTO v_template_id FROM story_templates
    WHERE title = 'How a Volcano Works' OR title ILIKE '%How a Volcano Works%'
    LIMIT 1;

  IF v_template_id IS NULL THEN
    RAISE NOTICE 'Template not found: How a Volcano Works';
    RETURN;
  END IF;

  -- Get current scenes
  SELECT script_data->'scenes' INTO v_scenes FROM story_templates WHERE id = v_template_id;

  IF v_scenes IS NULL OR jsonb_array_length(v_scenes) = 0 THEN
    RAISE NOTICE 'No scenes found for template id %', v_template_id;
    RETURN;
  END IF;

  -- Update each scene's insertion_prompt
  FOR v_idx IN 0..jsonb_array_length(v_scenes) - 1 LOOP
    v_scene := v_scenes->v_idx;
    CASE (v_scene->>'scene_number')::INTEGER
      WHEN 1 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the equipment table photo with the character in the white background. Match the pose of the character trying on the hard hat. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 2 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the Earth model photo with the character in the white background. Match the pose of the character pointing at the Earth model. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 3 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the hiking trail photo with the character in the white background. Match the pose of the character examining the volcanic rock. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 4 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the rock layers photo with the character in the white background. Match the pose of the character examining the rock layers. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 5 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the seismograph photo with the character in the white background. Match the pose of the character watching the seismograph. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 6 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the crater viewing photo with the character in the white background. Match the pose of the character looking into the crater. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 7 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the lava flow photo with the character in the white background. Match the pose of the character watching the lava flow. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 8 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the eruption viewing photo with the character in the white background. Match the pose of the character watching the eruption. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 9 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the lava ocean photo with the character in the white background. Match the pose of the character watching the lava enter the ocean. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 10 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the volcanic valley photo with the character in the white background. Match the pose of the character sitting in the green valley. make it look like it was taken with the character from the white background photo"'::JSONB);
      ELSE NULL; -- leave unknown scenes unchanged
    END CASE;
    v_updated_scenes := v_updated_scenes || v_scene;
  END LOOP;

  -- Write back
  UPDATE story_templates
    SET script_data = jsonb_set(script_data, '{scenes}', v_updated_scenes)
    WHERE id = v_template_id;

  RAISE NOTICE 'Updated template % (id=%)', 'How a Volcano Works', v_template_id;
END $$;

-- Template: Inside the Human Body (10 scenes)
DO $$
DECLARE
  v_template_id INTEGER;
  v_scenes JSONB;
  v_updated_scenes JSONB := '[]'::JSONB;
  v_scene JSONB;
  v_idx INTEGER;
BEGIN
  -- Find template (try exact match, then ILIKE)
  SELECT id INTO v_template_id FROM story_templates
    WHERE title = 'Inside the Human Body' OR title ILIKE '%Inside the Human Body%'
    LIMIT 1;

  IF v_template_id IS NULL THEN
    RAISE NOTICE 'Template not found: Inside the Human Body';
    RETURN;
  END IF;

  -- Get current scenes
  SELECT script_data->'scenes' INTO v_scenes FROM story_templates WHERE id = v_template_id;

  IF v_scenes IS NULL OR jsonb_array_length(v_scenes) = 0 THEN
    RAISE NOTICE 'No scenes found for template id %', v_template_id;
    RETURN;
  END IF;

  -- Update each scene's insertion_prompt
  FOR v_idx IN 0..jsonb_array_length(v_scenes) - 1 LOOP
    v_scene := v_scenes->v_idx;
    CASE (v_scene->>'scene_number')::INTEGER
      WHEN 1 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the shrinking pod photo with the character in the white background. Match the pose of the character sitting inside the science pod. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 2 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the heart interior photo with the character in the white background. Match the pose of the character visible through the submarine porthole. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 3 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the lung interior photo with the character in the white background. Match the pose of the character standing inside the lung cave. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 4 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the brain landscape photo with the character in the white background. Match the pose of the character standing on the brain landscape. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 5 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the stomach interior photo with the character in the white background. Match the pose of the character visible through the submarine porthole. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 6 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the bone interior photo with the character in the white background. Match the pose of the character standing inside the bone cathedral. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 7 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the immune system photo with the character in the white background. Match the pose of the character watching through the submarine porthole. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 8 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the eye interior photo with the character in the white background. Match the pose of the character inside the eye chamber. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 9 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the skin layers photo with the character in the white background. Match the pose of the character traveling through the skin layers. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 10 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the science museum photo with the character in the white background. Match the pose of the character stepping out of the pod. make it look like it was taken with the character from the white background photo"'::JSONB);
      ELSE NULL; -- leave unknown scenes unchanged
    END CASE;
    v_updated_scenes := v_updated_scenes || v_scene;
  END LOOP;

  -- Write back
  UPDATE story_templates
    SET script_data = jsonb_set(script_data, '{scenes}', v_updated_scenes)
    WHERE id = v_template_id;

  RAISE NOTICE 'Updated template % (id=%)', 'Inside the Human Body', v_template_id;
END $$;

-- Template: The Robot Best Friend (10 scenes)
DO $$
DECLARE
  v_template_id INTEGER;
  v_scenes JSONB;
  v_updated_scenes JSONB := '[]'::JSONB;
  v_scene JSONB;
  v_idx INTEGER;
BEGIN
  -- Find template (try exact match, then ILIKE)
  SELECT id INTO v_template_id FROM story_templates
    WHERE title = 'The Robot Best Friend' OR title ILIKE '%The Robot Best Friend%'
    LIMIT 1;

  IF v_template_id IS NULL THEN
    RAISE NOTICE 'Template not found: The Robot Best Friend';
    RETURN;
  END IF;

  -- Get current scenes
  SELECT script_data->'scenes' INTO v_scenes FROM story_templates WHERE id = v_template_id;

  IF v_scenes IS NULL OR jsonb_array_length(v_scenes) = 0 THEN
    RAISE NOTICE 'No scenes found for template id %', v_template_id;
    RETURN;
  END IF;

  -- Update each scene's insertion_prompt
  FOR v_idx IN 0..jsonb_array_length(v_scenes) - 1 LOOP
    v_scene := v_scenes->v_idx;
    CASE (v_scene->>'scene_number')::INTEGER
      WHEN 1 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the bedroom photo with the character in the white background. Match the pose of the character meeting the robot. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 2 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the doorstep photo with the character in the white background. Match the pose of the character helping the robot up. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 3 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the grocery store photo with the character in the white background. Match the pose of the character on the step stool reaching for apples. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 4 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the park photo with the character in the white background. Match the pose of the character crouching beside the robot and the dog. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 5 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the path intersection photo with the character in the white background. Match the pose of the character pointing at the park map sign. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 6 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the rainstorm photo with the character in the white background. Match the pose of the character sheltering under the tree with the robot. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 7 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the pavement photo with the character in the white background. Match the pose of the character crouching beside the powered-down robot. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 8 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the rescue photo with the character in the white background. Match the pose of the character plugging in the robot''s charging cable. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 9 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the evening walk photo with the character in the white background. Match the pose of the character walking hand in hand with the robot. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 10 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the bedroom goodnight photo with the character in the white background. Match the pose of the character in bed saying goodnight to the robot. make it look like it was taken with the character from the white background photo"'::JSONB);
      ELSE NULL; -- leave unknown scenes unchanged
    END CASE;
    v_updated_scenes := v_updated_scenes || v_scene;
  END LOOP;

  -- Write back
  UPDATE story_templates
    SET script_data = jsonb_set(script_data, '{scenes}', v_updated_scenes)
    WHERE id = v_template_id;

  RAISE NOTICE 'Updated template % (id=%)', 'The Robot Best Friend', v_template_id;
END $$;

-- Template: Under the Ocean (10 scenes)
DO $$
DECLARE
  v_template_id INTEGER;
  v_scenes JSONB;
  v_updated_scenes JSONB := '[]'::JSONB;
  v_scene JSONB;
  v_idx INTEGER;
BEGIN
  -- Find template (try exact match, then ILIKE)
  SELECT id INTO v_template_id FROM story_templates
    WHERE title = 'Under the Ocean' OR title ILIKE '%Under the Ocean%'
    LIMIT 1;

  IF v_template_id IS NULL THEN
    RAISE NOTICE 'Template not found: Under the Ocean';
    RETURN;
  END IF;

  -- Get current scenes
  SELECT script_data->'scenes' INTO v_scenes FROM story_templates WHERE id = v_template_id;

  IF v_scenes IS NULL OR jsonb_array_length(v_scenes) = 0 THEN
    RAISE NOTICE 'No scenes found for template id %', v_template_id;
    RETURN;
  END IF;

  -- Update each scene's insertion_prompt
  FOR v_idx IN 0..jsonb_array_length(v_scenes) - 1 LOOP
    v_scene := v_scenes->v_idx;
    CASE (v_scene->>'scene_number')::INTEGER
      WHEN 1 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the dock photo with the character in the white background. Match the pose of the character standing on the dock. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 2 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the submarine interior photo with the character in the white background. Match the pose of the character at the submarine observation window. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 3 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the coral reef window photo with the character in the white background. Match the pose of the character at the submarine window watching the coral reef. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 4 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the turtle window photo with the character in the white background. Match the pose of the character watching the sea turtle. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 5 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the fish school photo with the character in the white background. Match the pose of the character watching the fish school. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 6 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the kelp forest photo with the character in the white background. Match the pose of the character watching the kelp forest. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 7 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the deep sea photo with the character in the white background. Match the pose of the character watching the bioluminescent creatures. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 8 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the whale shark photo with the character in the white background. Match the pose of the character watching the whale shark. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 9 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the ocean conservation photo with the character in the white background. Match the pose of the character watching the pollution through the window. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 10 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the ocean explorer certificate photo with the character in the white background. Match the pose of the character holding up the certificate. make it look like it was taken with the character from the white background photo"'::JSONB);
      ELSE NULL; -- leave unknown scenes unchanged
    END CASE;
    v_updated_scenes := v_updated_scenes || v_scene;
  END LOOP;

  -- Write back
  UPDATE story_templates
    SET script_data = jsonb_set(script_data, '{scenes}', v_updated_scenes)
    WHERE id = v_template_id;

  RAISE NOTICE 'Updated template % (id=%)', 'Under the Ocean', v_template_id;
END $$;

-- Template: The Earthquake Investigator (10 scenes)
DO $$
DECLARE
  v_template_id INTEGER;
  v_scenes JSONB;
  v_updated_scenes JSONB := '[]'::JSONB;
  v_scene JSONB;
  v_idx INTEGER;
BEGIN
  -- Find template (try exact match, then ILIKE)
  SELECT id INTO v_template_id FROM story_templates
    WHERE title = 'The Earthquake Investigator' OR title ILIKE '%The Earthquake Investigator%'
    LIMIT 1;

  IF v_template_id IS NULL THEN
    RAISE NOTICE 'Template not found: The Earthquake Investigator';
    RETURN;
  END IF;

  -- Get current scenes
  SELECT script_data->'scenes' INTO v_scenes FROM story_templates WHERE id = v_template_id;

  IF v_scenes IS NULL OR jsonb_array_length(v_scenes) = 0 THEN
    RAISE NOTICE 'No scenes found for template id %', v_template_id;
    RETURN;
  END IF;

  -- Update each scene's insertion_prompt
  FOR v_idx IN 0..jsonb_array_length(v_scenes) - 1 LOOP
    v_scene := v_scenes->v_idx;
    CASE (v_scene->>'scene_number')::INTEGER
      WHEN 1 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the equipment table photo with the character in the white background. Match the pose of the character trying on the hard hat at the equipment table. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 2 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the tectonic plates map photo with the character in the white background. Match the pose of the character pointing at the tectonic plates map. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 3 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the fault line photo with the character in the white background. Match the pose of the character standing at the fault line. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 4 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the seismograph photo with the character in the white background. Match the pose of the character watching the seismograph. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 5 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the wave diagram photo with the character in the white background. Match the pose of the character holding the slinky beside the diagram. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 6 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the magnitude scale photo with the character in the white background. Match the pose of the character pointing at the magnitude scale. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 7 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the shake table photo with the character in the white background. Match the pose of the character watching the shake table. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 8 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the ring of fire map photo with the character in the white background. Match the pose of the character tracing the Ring of Fire on the map. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 9 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the tremor photo with the character in the white background. Match the pose of the character feeling the tremor. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 10 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the certificate photo with the character in the white background. Match the pose of the character holding the seismograph roll and certificate. make it look like it was taken with the character from the white background photo"'::JSONB);
      ELSE NULL; -- leave unknown scenes unchanged
    END CASE;
    v_updated_scenes := v_updated_scenes || v_scene;
  END LOOP;

  -- Write back
  UPDATE story_templates
    SET script_data = jsonb_set(script_data, '{scenes}', v_updated_scenes)
    WHERE id = v_template_id;

  RAISE NOTICE 'Updated template % (id=%)', 'The Earthquake Investigator', v_template_id;
END $$;

-- Template: Colors of the Carnival (10 scenes)
DO $$
DECLARE
  v_template_id INTEGER;
  v_scenes JSONB;
  v_updated_scenes JSONB := '[]'::JSONB;
  v_scene JSONB;
  v_idx INTEGER;
BEGIN
  -- Find template (try exact match, then ILIKE)
  SELECT id INTO v_template_id FROM story_templates
    WHERE title = 'Colors of the Carnival' OR title ILIKE '%Colors of the Carnival%'
    LIMIT 1;

  IF v_template_id IS NULL THEN
    RAISE NOTICE 'Template not found: Colors of the Carnival';
    RETURN;
  END IF;

  -- Get current scenes
  SELECT script_data->'scenes' INTO v_scenes FROM story_templates WHERE id = v_template_id;

  IF v_scenes IS NULL OR jsonb_array_length(v_scenes) = 0 THEN
    RAISE NOTICE 'No scenes found for template id %', v_template_id;
    RETURN;
  END IF;

  -- Update each scene's insertion_prompt
  FOR v_idx IN 0..jsonb_array_length(v_scenes) - 1 LOOP
    v_scene := v_scenes->v_idx;
    CASE (v_scene->>'scene_number')::INTEGER
      WHEN 1 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the balloon photo with the character in the white background. Match the pose of the character pointing at the red balloons. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 2 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the pumpkin stall photo with the character in the white background. Match the pose of the character at the pumpkin stall. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 3 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the popcorn cart photo with the character in the white background. Match the pose of the character at the popcorn cart. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 4 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the frog game photo with the character in the white background. Match the pose of the character at the frog toss game. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 5 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the ribbon photo with the character in the white background. Match the pose of the character holding the blue ribbon. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 6 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the magic show photo with the character in the white background. Match the pose of the character watching the magic show. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 7 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the cotton candy photo with the character in the white background. Match the pose of the character holding the cotton candy. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 8 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the snow cone photo with the character in the white background. Match the pose of the character holding the snow cone. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 9 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the chocolate fountain photo with the character in the white background. Match the pose of the character at the chocolate fountain. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 10 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the rainbow carnival photo with the character in the white background. Match the pose of the character in the center of the rainbow carnival finale. make it look like it was taken with the character from the white background photo"'::JSONB);
      ELSE NULL; -- leave unknown scenes unchanged
    END CASE;
    v_updated_scenes := v_updated_scenes || v_scene;
  END LOOP;

  -- Write back
  UPDATE story_templates
    SET script_data = jsonb_set(script_data, '{scenes}', v_updated_scenes)
    WHERE id = v_template_id;

  RAISE NOTICE 'Updated template % (id=%)', 'Colors of the Carnival', v_template_id;
END $$;

-- Template: The Great Bake Sale (10 scenes)
DO $$
DECLARE
  v_template_id INTEGER;
  v_scenes JSONB;
  v_updated_scenes JSONB := '[]'::JSONB;
  v_scene JSONB;
  v_idx INTEGER;
BEGIN
  -- Find template (try exact match, then ILIKE)
  SELECT id INTO v_template_id FROM story_templates
    WHERE title = 'The Great Bake Sale' OR title ILIKE '%The Great Bake Sale%'
    LIMIT 1;

  IF v_template_id IS NULL THEN
    RAISE NOTICE 'Template not found: The Great Bake Sale';
    RETURN;
  END IF;

  -- Get current scenes
  SELECT script_data->'scenes' INTO v_scenes FROM story_templates WHERE id = v_template_id;

  IF v_scenes IS NULL OR jsonb_array_length(v_scenes) = 0 THEN
    RAISE NOTICE 'No scenes found for template id %', v_template_id;
    RETURN;
  END IF;

  -- Update each scene's insertion_prompt
  FOR v_idx IN 0..jsonb_array_length(v_scenes) - 1 LOOP
    v_scene := v_scenes->v_idx;
    CASE (v_scene->>'scene_number')::INTEGER
      WHEN 1 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the kitchen planning photo with the character in the white background. Match the pose of the character counting eggs at the kitchen table. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 2 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the measuring photo with the character in the white background. Match the pose of the character measuring flour into the mixing bowl. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 3 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the cooling rack photo with the character in the white background. Match the pose of the character arranging cookies on the cooling rack. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 4 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the decorating photo with the character in the white background. Match the pose of the character decorating cookies with a pattern. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 5 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the bake sale stall photo with the character in the white background. Match the pose of the character standing behind the bake sale stall. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 6 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the selling photo with the character in the white background. Match the pose of the character checking the cookie plates. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 7 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the coin counting photo with the character in the white background. Match the pose of the character counting coins and cookies. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 8 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the comparing plates photo with the character in the white background. Match the pose of the character comparing the two cookie plates. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 9 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the coin counting photo with the character in the white background. Match the pose of the character counting the coins on the table. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 10 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the sold out photo with the character in the white background. Match the pose of the character holding the full coin jar at the empty stall. make it look like it was taken with the character from the white background photo"'::JSONB);
      ELSE NULL; -- leave unknown scenes unchanged
    END CASE;
    v_updated_scenes := v_updated_scenes || v_scene;
  END LOOP;

  -- Write back
  UPDATE story_templates
    SET script_data = jsonb_set(script_data, '{scenes}', v_updated_scenes)
    WHERE id = v_template_id;

  RAISE NOTICE 'Updated template % (id=%)', 'The Great Bake Sale', v_template_id;
END $$;

-- Template: The Time Traveler's Backpack (10 scenes)
DO $$
DECLARE
  v_template_id INTEGER;
  v_scenes JSONB;
  v_updated_scenes JSONB := '[]'::JSONB;
  v_scene JSONB;
  v_idx INTEGER;
BEGIN
  -- Find template (try exact match, then ILIKE)
  SELECT id INTO v_template_id FROM story_templates
    WHERE title = 'The Time Traveler''s Backpack' OR title ILIKE '%The Time Traveler''s Backpack%'
    LIMIT 1;

  IF v_template_id IS NULL THEN
    RAISE NOTICE 'Template not found: The Time Traveler''s Backpack';
    RETURN;
  END IF;

  -- Get current scenes
  SELECT script_data->'scenes' INTO v_scenes FROM story_templates WHERE id = v_template_id;

  IF v_scenes IS NULL OR jsonb_array_length(v_scenes) = 0 THEN
    RAISE NOTICE 'No scenes found for template id %', v_template_id;
    RETURN;
  END IF;

  -- Update each scene's insertion_prompt
  FOR v_idx IN 0..jsonb_array_length(v_scenes) - 1 LOOP
    v_scene := v_scenes->v_idx;
    CASE (v_scene->>'scene_number')::INTEGER
      WHEN 1 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the attic photo with the character in the white background. Match the pose of the character discovering the backpack in the attic. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 2 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the dinosaur photo with the character in the white background. Match the pose of the character standing beside the Triceratops. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 3 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the Egypt photo with the character in the white background. Match the pose of the character watching the pyramid being built. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 4 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the Colosseum photo with the character in the white background. Match the pose of the character watching from the Colosseum stands. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 5 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the castle photo with the character in the white background. Match the pose of the character in the medieval castle courtyard. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 6 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the Japan photo with the character in the white background. Match the pose of the character bowing in the Japanese castle courtyard. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 7 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the Wild West photo with the character in the white background. Match the pose of the character on the Wild West boardwalk. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 8 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the future city photo with the character in the white background. Match the pose of the character on the floating platform above the future city. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 9 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the glowing backpack photo with the character in the white background. Match the pose of the character holding the glowing backpack before the final jump. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 10 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the attic return photo with the character in the white background. Match the pose of the character sitting with the backpack in the attic. make it look like it was taken with the character from the white background photo"'::JSONB);
      ELSE NULL; -- leave unknown scenes unchanged
    END CASE;
    v_updated_scenes := v_updated_scenes || v_scene;
  END LOOP;

  -- Write back
  UPDATE story_templates
    SET script_data = jsonb_set(script_data, '{scenes}', v_updated_scenes)
    WHERE id = v_template_id;

  RAISE NOTICE 'Updated template % (id=%)', 'The Time Traveler''s Backpack', v_template_id;
END $$;

-- Template: Pizza Party Problem (10 scenes)
DO $$
DECLARE
  v_template_id INTEGER;
  v_scenes JSONB;
  v_updated_scenes JSONB := '[]'::JSONB;
  v_scene JSONB;
  v_idx INTEGER;
BEGIN
  -- Find template (try exact match, then ILIKE)
  SELECT id INTO v_template_id FROM story_templates
    WHERE title = 'Pizza Party Problem' OR title ILIKE '%Pizza Party Problem%'
    LIMIT 1;

  IF v_template_id IS NULL THEN
    RAISE NOTICE 'Template not found: Pizza Party Problem';
    RETURN;
  END IF;

  -- Get current scenes
  SELECT script_data->'scenes' INTO v_scenes FROM story_templates WHERE id = v_template_id;

  IF v_scenes IS NULL OR jsonb_array_length(v_scenes) = 0 THEN
    RAISE NOTICE 'No scenes found for template id %', v_template_id;
    RETURN;
  END IF;

  -- Update each scene's insertion_prompt
  FOR v_idx IN 0..jsonb_array_length(v_scenes) - 1 LOOP
    v_scene := v_scenes->v_idx;
    CASE (v_scene->>'scene_number')::INTEGER
      WHEN 1 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the invitation photo with the character in the white background. Match the pose of the character counting invitations. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 2 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the table setting photo with the character in the white background. Match the pose of the character setting the table. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 3 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the pizza math photo with the character in the white background. Match the pose of the character doing pizza math. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 4 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the topping planning photo with the character in the white background. Match the pose of the character planning the toppings. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 5 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the dough quarters photo with the character in the white background. Match the pose of the character dividing the dough. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 6 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the topping photo with the character in the white background. Match the pose of the character adding toppings. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 7 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the pizza cutting photo with the character in the white background. Match the pose of the character cutting the pizza. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 8 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the sharing photo with the character in the white background. Match the pose of the character sharing the pizza slices. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 9 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the extra slice photo with the character in the white background. Match the pose of the character solving the extra slice problem. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 10 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the leftover pizza photo with the character in the white background. Match the pose of the character with the leftover pizza. make it look like it was taken with the character from the white background photo"'::JSONB);
      ELSE NULL; -- leave unknown scenes unchanged
    END CASE;
    v_updated_scenes := v_updated_scenes || v_scene;
  END LOOP;

  -- Write back
  UPDATE story_templates
    SET script_data = jsonb_set(script_data, '{scenes}', v_updated_scenes)
    WHERE id = v_template_id;

  RAISE NOTICE 'Updated template % (id=%)', 'Pizza Party Problem', v_template_id;
END $$;

-- Template: Animals A-I (9 scenes)
DO $$
DECLARE
  v_template_id INTEGER;
  v_scenes JSONB;
  v_updated_scenes JSONB := '[]'::JSONB;
  v_scene JSONB;
  v_idx INTEGER;
BEGIN
  -- Find template (try exact match, then ILIKE)
  SELECT id INTO v_template_id FROM story_templates
    WHERE title = 'Animals A-I' OR title ILIKE '%Animals A-I%'
    LIMIT 1;

  IF v_template_id IS NULL THEN
    RAISE NOTICE 'Template not found: Animals A-I';
    RETURN;
  END IF;

  -- Get current scenes
  SELECT script_data->'scenes' INTO v_scenes FROM story_templates WHERE id = v_template_id;

  IF v_scenes IS NULL OR jsonb_array_length(v_scenes) = 0 THEN
    RAISE NOTICE 'No scenes found for template id %', v_template_id;
    RETURN;
  END IF;

  -- Update each scene's insertion_prompt
  FOR v_idx IN 0..jsonb_array_length(v_scenes) - 1 LOOP
    v_scene := v_scenes->v_idx;
    CASE (v_scene->>'scene_number')::INTEGER
      WHEN 1 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the alligator photo with the character in the white background. Match the pose of the character watching the alligator. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 2 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the buffalo photo with the character in the white background. Match the pose of the character watching the buffalo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 3 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the camel photo with the character in the white background. Match the pose of the character with the camel. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 4 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the dolphin photo with the character in the white background. Match the pose of the character watching the dolphin. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 5 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the elephant photo with the character in the white background. Match the pose of the character beside the elephant. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 6 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the flamingo photo with the character in the white background. Match the pose of the character beside the flamingo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 7 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the giraffe photo with the character in the white background. Match the pose of the character beside the giraffe. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 8 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the hippo photo with the character in the white background. Match the pose of the character watching the hippo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 9 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the iguana photo with the character in the white background. Match the pose of the character with the iguana. make it look like it was taken with the character from the white background photo"'::JSONB);
      ELSE NULL; -- leave unknown scenes unchanged
    END CASE;
    v_updated_scenes := v_updated_scenes || v_scene;
  END LOOP;

  -- Write back
  UPDATE story_templates
    SET script_data = jsonb_set(script_data, '{scenes}', v_updated_scenes)
    WHERE id = v_template_id;

  RAISE NOTICE 'Updated template % (id=%)', 'Animals A-I', v_template_id;
END $$;

-- Template: Animals J-R (9 scenes)
DO $$
DECLARE
  v_template_id INTEGER;
  v_scenes JSONB;
  v_updated_scenes JSONB := '[]'::JSONB;
  v_scene JSONB;
  v_idx INTEGER;
BEGIN
  -- Find template (try exact match, then ILIKE)
  SELECT id INTO v_template_id FROM story_templates
    WHERE title = 'Animals J-R' OR title ILIKE '%Animals J-R%'
    LIMIT 1;

  IF v_template_id IS NULL THEN
    RAISE NOTICE 'Template not found: Animals J-R';
    RETURN;
  END IF;

  -- Get current scenes
  SELECT script_data->'scenes' INTO v_scenes FROM story_templates WHERE id = v_template_id;

  IF v_scenes IS NULL OR jsonb_array_length(v_scenes) = 0 THEN
    RAISE NOTICE 'No scenes found for template id %', v_template_id;
    RETURN;
  END IF;

  -- Update each scene's insertion_prompt
  FOR v_idx IN 0..jsonb_array_length(v_scenes) - 1 LOOP
    v_scene := v_scenes->v_idx;
    CASE (v_scene->>'scene_number')::INTEGER
      WHEN 10 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the jaguar photo with the character in the white background. Match the pose of the character spotting the jaguar. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 11 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the kangaroo photo with the character in the white background. Match the pose of the character with the kangaroo. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 12 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the lion photo with the character in the white background. Match the pose of the character watching the lion. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 13 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the monkey photo with the character in the white background. Match the pose of the character watching the monkey. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 14 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the narwhal photo with the character in the white background. Match the pose of the character watching the narwhal. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 15 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the octopus photo with the character in the white background. Match the pose of the character watching the octopus. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 16 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the polar bear photo with the character in the white background. Match the pose of the character watching the polar bear. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 17 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the quail photo with the character in the white background. Match the pose of the character watching the quail. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 18 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the rhino photo with the character in the white background. Match the pose of the character watching the rhino. make it look like it was taken with the character from the white background photo"'::JSONB);
      ELSE NULL; -- leave unknown scenes unchanged
    END CASE;
    v_updated_scenes := v_updated_scenes || v_scene;
  END LOOP;

  -- Write back
  UPDATE story_templates
    SET script_data = jsonb_set(script_data, '{scenes}', v_updated_scenes)
    WHERE id = v_template_id;

  RAISE NOTICE 'Updated template % (id=%)', 'Animals J-R', v_template_id;
END $$;

-- Template: Animals S-Z (8 scenes)
DO $$
DECLARE
  v_template_id INTEGER;
  v_scenes JSONB;
  v_updated_scenes JSONB := '[]'::JSONB;
  v_scene JSONB;
  v_idx INTEGER;
BEGIN
  -- Find template (try exact match, then ILIKE)
  SELECT id INTO v_template_id FROM story_templates
    WHERE title = 'Animals S-Z' OR title ILIKE '%Animals S-Z%'
    LIMIT 1;

  IF v_template_id IS NULL THEN
    RAISE NOTICE 'Template not found: Animals S-Z';
    RETURN;
  END IF;

  -- Get current scenes
  SELECT script_data->'scenes' INTO v_scenes FROM story_templates WHERE id = v_template_id;

  IF v_scenes IS NULL OR jsonb_array_length(v_scenes) = 0 THEN
    RAISE NOTICE 'No scenes found for template id %', v_template_id;
    RETURN;
  END IF;

  -- Update each scene's insertion_prompt
  FOR v_idx IN 0..jsonb_array_length(v_scenes) - 1 LOOP
    v_scene := v_scenes->v_idx;
    CASE (v_scene->>'scene_number')::INTEGER
      WHEN 19 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the shark photo with the character in the white background. Match the pose of the character watching the shark. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 20 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the tiger photo with the character in the white background. Match the pose of the character spotting the tiger. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 21 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the urchin photo with the character in the white background. Match the pose of the character looking at the sea urchin. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 22 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the vulture photo with the character in the white background. Match the pose of the character watching the vulture. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 23 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the whale photo with the character in the white background. Match the pose of the character watching the whale. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 24 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the x-ray fish photo with the character in the white background. Match the pose of the character watching the x-ray fish. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 25 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the yak photo with the character in the white background. Match the pose of the character beside the yak. make it look like it was taken with the character from the white background photo"'::JSONB);
      WHEN 26 THEN v_scene := jsonb_set(v_scene, '{insertion_prompt}', '"replace the character in the zebra photo with the character in the white background. Match the pose of the character beside the zebra. make it look like it was taken with the character from the white background photo"'::JSONB);
      ELSE NULL; -- leave unknown scenes unchanged
    END CASE;
    v_updated_scenes := v_updated_scenes || v_scene;
  END LOOP;

  -- Write back
  UPDATE story_templates
    SET script_data = jsonb_set(script_data, '{scenes}', v_updated_scenes)
    WHERE id = v_template_id;

  RAISE NOTICE 'Updated template % (id=%)', 'Animals S-Z', v_template_id;
END $$;
