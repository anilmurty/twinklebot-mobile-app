-- Migration: 049_populate_mission_moon_mock_story_data.sql
-- Description: Populate mock_story_data for "Mission To The Moon" template
-- Created: 2026-03-05

DO $$
DECLARE
  moon_id INTEGER;
BEGIN
  SELECT id INTO moon_id FROM story_templates WHERE title = 'Mission To The Moon' LIMIT 1;

  IF moon_id IS NOT NULL THEN
    UPDATE story_templates
    SET mock_story_data = '{
      "character_name": "Alex",
      "scenes": [
        {
          "scene_number": 1,
          "headline": "Chosen for the Mission",
          "script_text": "One night, Alex looks out the window at the Moon and wonders how rockets get there. That night, Alex dreams that NASA has chosen them for a special mission to the Moon.",
          "text": "One night, Alex looks out the window at the Moon and wonders how rockets get there. That night, Alex dreams that NASA has chosen them for a special mission to the Moon.",
          "image_url": "/mission-to-the-moon/mock-story/1-looking-out-the-window.png"
        },
        {
          "scene_number": 2,
          "headline": "The Space Center",
          "script_text": "In the dream, Alex arrives at a huge space center filled with rockets and screens. Scientists explain that this mission will travel beyond Earth using science and engineering.",
          "text": "In the dream, Alex arrives at a huge space center filled with rockets and screens. Scientists explain that this mission will travel beyond Earth using science and engineering.",
          "image_url": "/mission-to-the-moon/mock-story/2-space-center.png"
        },
        {
          "scene_number": 3,
          "headline": "Suiting Up",
          "script_text": "Before launch, Alex puts on a space suit. The suit provides air to breathe and protection where there is no atmosphere.",
          "text": "Before launch, Alex puts on a space suit. The suit provides air to breathe and protection where there is no atmosphere.",
          "image_url": "/mission-to-the-moon/mock-story/3-suiting-up.png"
        },
        {
          "scene_number": 4,
          "headline": "Inside the Rocket",
          "script_text": "Alex climbs into the rocket and buckles in. The rocket is filled with fuel that will power the engines strong enough to escape Earth''s gravity.",
          "text": "Alex climbs into the rocket and buckles in. The rocket is filled with fuel that will power the engines strong enough to escape Earth''s gravity.",
          "image_url": "/mission-to-the-moon/mock-story/4-inside-the-rocket.png"
        },
        {
          "scene_number": 5,
          "headline": "Fighting Gravity",
          "script_text": "The engines roar and the rocket lifts off. Alex feels heavy in the seat because gravity pulls everything downward while the rocket pushes upward.",
          "text": "The engines roar and the rocket lifts off. Alex feels heavy in the seat because gravity pulls everything downward while the rocket pushes upward.",
          "image_url": "/mission-to-the-moon/mock-story/5-fighting-gravity.png"
        },
        {
          "scene_number": 6,
          "headline": "Weightless in Space",
          "script_text": "Once the rocket reaches space, the heavy feeling disappears. Alex floats gently as the rocket orbits Earth, creating weightlessness.",
          "text": "Once the rocket reaches space, the heavy feeling disappears. Alex floats gently as the rocket orbits Earth, creating weightlessness.",
          "image_url": "/mission-to-the-moon/mock-story/6-weightless-in-space.png"
        },
        {
          "scene_number": 7,
          "headline": "Landing on the Moon",
          "script_text": "The rocket travels onward and gently lands on the Moon. Alex steps onto the dusty surface and sees Earth shining far away.",
          "text": "The rocket travels onward and gently lands on the Moon. Alex steps onto the dusty surface and sees Earth shining far away.",
          "image_url": "/mission-to-the-moon/mock-story/7-landing-on-moon.png"
        },
        {
          "scene_number": 8,
          "headline": "Moon Gravity",
          "script_text": "Walking on the Moon feels strange. Because the Moon''s gravity is weaker, every step turns into a slow, high hop.",
          "text": "Walking on the Moon feels strange. Because the Moon''s gravity is weaker, every step turns into a slow, high hop.",
          "image_url": "/mission-to-the-moon/mock-story/8-moon-gravity.png"
        },
        {
          "scene_number": 9,
          "headline": "Heading Home",
          "script_text": "After exploring, it''s time to return. Alex climbs back into the rocket, which lifts off easily from the Moon''s low gravity.",
          "text": "After exploring, it''s time to return. Alex climbs back into the rocket, which lifts off easily from the Moon''s low gravity.",
          "image_url": "/mission-to-the-moon/mock-story/9-heading-home.png"
        },
        {
          "scene_number": 10,
          "headline": "Waking Up Inspired",
          "script_text": "Morning light fills the room as Alex wakes up. The Moon is still in the sky, and now Alex knows that gravity, rockets, and science make space travel possible—and there is so much more to learn.",
          "text": "Morning light fills the room as Alex wakes up. The Moon is still in the sky, and now Alex knows that gravity, rockets, and science make space travel possible—and there is so much more to learn.",
          "image_url": "/mission-to-the-moon/mock-story/10-waking-up-insipired.png"
        }
      ]
    }'::jsonb
    WHERE id = moon_id;

    RAISE NOTICE 'Populated mock_story_data for Mission To The Moon (id: %)', moon_id;
  ELSE
    RAISE NOTICE 'Mission To The Moon template not found. Please run migration 047_seed_mission_to_the_moon.sql first.';
  END IF;
END $$;
