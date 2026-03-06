-- Migration: 047_seed_mission_to_the_moon.sql
-- Description: Seed "Mission To The Moon" story template with 10 scenes
-- Created: 2026-03-05

-- Add 'scifi' to the allowed category values
ALTER TABLE story_templates DROP CONSTRAINT IF EXISTS story_templates_category_check;
ALTER TABLE story_templates ADD CONSTRAINT story_templates_category_check
  CHECK (category IN ('numbers', 'letters', 'scifi'));

DO $$
DECLARE
  nano_banana_pro_model_id INTEGER;
  existing_template_id INTEGER;
  template_data JSONB;
BEGIN
  -- Get the nano-banana-pro model ID
  SELECT id INTO nano_banana_pro_model_id
  FROM generation_models
  WHERE name = 'nano-banana-pro' AND is_active = true
  LIMIT 1;

  IF nano_banana_pro_model_id IS NULL THEN
    RAISE EXCEPTION 'nano-banana-pro model not found. Please run migration 017_add_nano_banana_pro_model.sql first.';
  END IF;

  -- Prepare template data
  template_data := '{
    "scenes": [
      {
        "scene_number": 1,
        "headline": "Chosen for the Mission",
        "script_text": "One night, [Name] looks out the window at the Moon and wonders how rockets get there. That night, [Name] dreams that NASA has chosen them for a special mission to the Moon.",
        "base_photo": "1-looking-out-the-window.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the window photo with the child in the white background. Match the pose and attire of the child in the window photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 2,
        "headline": "The Space Center",
        "script_text": "In the dream, [Name] arrives at a huge space center filled with rockets and screens. Scientists explain that this mission will travel beyond Earth using science and engineering.",
        "base_photo": "2-space-center.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the space center photo with the child in the white background, including the space suit. Match the pose of the child in the space center photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 3,
        "headline": "Suiting Up",
        "script_text": "Before launch, [Name] puts on a space suit. The suit provides air to breathe and protection where there is no atmosphere.",
        "base_photo": "3-suiting-up.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the spacesuit photo with the child in the white background, including the space suit. Match the pose of the child in the spacesuit photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 4,
        "headline": "Inside the Rocket",
        "script_text": "[Name] climbs into the rocket and buckles in. The rocket is filled with fuel that will power the engines strong enough to escape Earth''s gravity.",
        "base_photo": "4-inside-the-rocket.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the rocket seat photo with the child in the white background, including the space suit. Match the pose of the child in the rocket seat photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 5,
        "headline": "Fighting Gravity",
        "script_text": "The engines roar and the rocket lifts off. [Name] feels heavy in the seat because gravity pulls everything downward while the rocket pushes upward.",
        "base_photo": "5-fighting-gravity.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the launch photo with the child in the white background, including the space suit. Match the pose of the child in the launch photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 6,
        "headline": "Weightless in Space",
        "script_text": "Once the rocket reaches space, the heavy feeling disappears. [Name] floats gently as the rocket orbits Earth, creating weightlessness.",
        "base_photo": "6-weightless-in-space.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the floating photo with the child in the white background, including the space suit. Match the pose of the child in the floating photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 7,
        "headline": "Landing on the Moon",
        "script_text": "The rocket travels onward and gently lands on the Moon. [Name] steps onto the dusty surface and sees Earth shining far away.",
        "base_photo": "7-landing-on-moon.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the moon landing photo with the child in the white background, including the space suit. Match the pose of the child in the moon landing photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 8,
        "headline": "Moon Gravity",
        "script_text": "Walking on the Moon feels strange. Because the Moon''s gravity is weaker, every step turns into a slow, high hop.",
        "base_photo": "8-moon-gravity.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the moon hopping photo with the child in the white background, including the space suit. Match the pose of the child in the moon hopping photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 9,
        "headline": "Heading Home",
        "script_text": "After exploring, it''s time to return. [Name] climbs back into the rocket, which lifts off easily from the Moon''s low gravity.",
        "base_photo": "9-heading-home.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the moon launch photo with the child in the white background, including the space suit. Match the pose of the child in the moon launch photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 10,
        "headline": "Waking Up Inspired",
        "script_text": "Morning light fills the room as [Name] wakes up. The Moon is still in the sky, and now [Name] knows that gravity, rockets, and science make space travel possible—and there is so much more to learn.",
        "base_photo": "10-waking-up-insipired.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the waking up photo with the child in the white background. Match the pose and attire of the child in the waking up photo. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      }
    ]
  }'::jsonb;

  -- Check if template already exists
  SELECT id INTO existing_template_id
  FROM story_templates
  WHERE title = 'Mission To The Moon'
  LIMIT 1;

  IF existing_template_id IS NOT NULL THEN
    -- Update existing template
    UPDATE story_templates
    SET
      description = 'Blast off on a mission to the Moon and learn about space, rockets, and gravity!',
      category = 'scifi',
      age_range = '2-6 years',
      scene_count = 10,
      cover_label = '',
      thumbnail_url = '/mission-to-the-moon/cover.png',
      generation_model_id = nano_banana_pro_model_id,
      fixed_prompt_parts = '{}'::jsonb,
      script_data = template_data,
      is_active = true
    WHERE id = existing_template_id;
    RAISE NOTICE 'Updated existing "Mission To The Moon" story template (id: %)', existing_template_id;
  ELSE
    -- Insert new template
    INSERT INTO story_templates (
      title,
      description,
      category,
      age_range,
      scene_count,
      cover_label,
      thumbnail_url,
      generation_model_id,
      fixed_prompt_parts,
      script_data,
      is_active
    ) VALUES (
      'Mission To The Moon',
      'Blast off on a mission to the Moon and learn about space, rockets, and gravity!',
      'scifi',
      '2-6 years',
      10,
      '',
      '/mission-to-the-moon/cover.png',
      nano_banana_pro_model_id,
      '{}'::jsonb,
      template_data,
      true
    );
    RAISE NOTICE 'Inserted new "Mission To The Moon" story template';
  END IF;
END $$;
