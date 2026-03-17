-- Migration: 058_seed_time_travelers_backpack.sql
-- Description: Convert The Time Traveler's Backpack from coming-soon to full story with script_data

-- ============================================================
-- The Time Traveler's Backpack (Sci-Fi & Fantasy)
-- ============================================================
UPDATE story_templates
SET
  scene_count = 10,
  script_data = '{
    "scenes": [
      {
        "scene_number": 1,
        "headline": "The Backpack in the Attic",
        "script_text": "[Name] is exploring the attic when something catches the light.\n\nA backpack. Old and worn, covered in small patches from places all over the world — and all through time. A leather compass on one strap. A tiny hourglass on the other, with sand that is moving upward instead of down.\n\n[Name] picks it up. It feels warm, like it has been waiting.\n\nThere is a note tucked into the front pocket, written in loopy handwriting:\n\n\"To the next great traveller — the backpack chooses its explorer. Touch the compass and name any time in history. It will take you there. And it will always bring you home.\"\n\n[Name] looks at the compass. It is spinning slowly.\n\n\"Dinosaurs,\" [Name] whispers.\n\nThe attic disappears.",
        "base_photo": "1-the-backpack-in-the-attic.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the attic photo with the child in the white background. Match the pose of the child discovering the backpack in the attic. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 2,
        "headline": "The Age of Dinosaurs",
        "script_text": "WHOOSH.\n\n[Name] lands in a jungle so thick and green the sky is barely visible. The air is warm and wet. Strange ferns the size of trees press in on every side.\n\nThen — the ground shakes.\n\nAnd around the bend in the path, a Triceratops lumbers into view. It is enormous — its three horns glinting in the filtered sunlight, its massive frill rippling as it lowers its head to eat the leaves right beside [Name].\n\n[Name] does not run. Does not move. Just breathes very, very slowly.\n\nThe Triceratops looks up. Blinks its enormous eye. Looks back down.\n\n[Name] exhales.\n\n\"Hello,\" [Name] whispers. \"I think you are the most incredible thing I have ever seen.\"",
        "base_photo": "2-the-age-of-dinosaurs.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the dinosaur photo with the child in the white background. Match the pose of the child standing beside the Triceratops. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 3,
        "headline": "Ancient Egypt",
        "script_text": "The jungle dissolves. Sand appears under [Name]''s feet.\n\nSun. Blazing, brilliant sun. And ahead — a pyramid. Not an old, worn, sandy ruin. A new pyramid, gleaming white, its limestone casing smooth and polished so it catches the light like a mirror.\n\nWorkers are all around — hundreds of them, pulling enormous stone blocks on wooden sledges, singing rhythmically as they pull together.\n\n[Name] watches a stone the size of a small house get lifted into position.\n\n\"They did this without machines?\" [Name] asks the backpack.\n\nThe backpack, of course, does not answer. But [Name] already knows the answer.\n\nThey did it with ten thousand people, working together, with ropes and ramps and incredible patience.",
        "base_photo": "3-ancient-egypt.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the Egypt photo with the child in the white background. Match the pose of the child watching the pyramid being built. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 4,
        "headline": "The Roman Colosseum",
        "script_text": "Sand again — but different sand. The roar of a crowd fills [Name]''s ears.\n\nThe Colosseum. Brand new. Its stone arches rising tier upon tier, flags flying from every level, the stands packed with thousands of people cheering.\n\nBut down in the arena — no gladiators today. Just a spectacular parade of wild animals: lions pacing, ostriches strutting, a giraffe walking gracefully past the watching crowd.\n\n\"This is where people came to be amazed,\" [Name] realises. \"Not just for fights. For wonder. For things they had never seen before.\"\n\nA lion pauses near the arena wall and looks directly up at [Name].\n\n[Name] looks back.\n\nThere is a long pause.\n\nThe lion looks away first.",
        "base_photo": "4-the-roman-colosseum.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the Colosseum photo with the child in the white background. Match the pose of the child watching from the Colosseum stands. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 5,
        "headline": "The Medieval Castle",
        "script_text": "Stone walls. A drawbridge. A moat.\n\n[Name] arrives in a medieval courtyard as a tournament is being prepared — knights in gleaming armour practising with lances in the yard, banners flying from every tower.\n\nA young squire — about the same age as [Name] — runs past carrying a heavy helmet, stops, stares at [Name]''s strange backpack, then keeps running.\n\n[Name] looks up at the castle towers. Each one flies a different coloured banner — red, blue, gold, green.\n\n\"Even back then,\" [Name] thinks, \"people were proud of where they came from. They made flags. They told stories. They wanted to be remembered.\"\n\nA trumpet sounds from the highest tower. The tournament is about to begin.",
        "base_photo": "5-the-medieval-castle.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the castle photo with the child in the white background. Match the pose of the child in the medieval castle courtyard. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 6,
        "headline": "Feudal Japan",
        "script_text": "Cherry blossoms fall like pink snow.\n\n[Name] stands in the courtyard of a Japanese castle — a different kind of castle entirely. White and graceful, its curved roofs sweeping upward at the corners, its walls perfectly white against the blue sky.\n\nA samurai warrior stands guard at the gate — perfectly still, armour lacquered black and red, a pair of swords at their side.\n\n[Name] bows slowly, the way the backpack seems to suggest.\n\nThe samurai bows back.\n\n\"Respect,\" [Name] thinks, \"looks the same in every time and every place.\"\n\nThe cherry blossoms keep falling. A single petal lands on [Name]''s nose.",
        "base_photo": "6-feudal-japan.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the Japan photo with the child in the white background. Match the pose of the child bowing in the Japanese castle courtyard. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 7,
        "headline": "The Wild West",
        "script_text": "Dust. Heat. A wide open sky going on forever.\n\n[Name] stands on a wooden boardwalk in a Wild West town — a single dirt road, wooden buildings on either side, horses tied to posts.\n\nAcross the street, a sign reads GENERAL STORE. Next to it: SHERIFF. Next to that: HOTEL.\n\nA tumbleweed rolls past.\n\n[Name] watches it go.\n\n\"Even in the wildest places,\" [Name] observes, \"people built towns. Schools. Stores. They made communities wherever they went.\"\n\nA horse tied to the post turns its large head and regards [Name] with calm, dark eyes.\n\n[Name] reaches up and pats its nose.\n\nThe horse snorts. That seems like approval.",
        "base_photo": "7-the-wild-west.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the Wild West photo with the child in the white background. Match the pose of the child on the Wild West boardwalk. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 8,
        "headline": "The Far Future",
        "script_text": "No ground. At least, not solid ground.\n\n[Name] is standing on a transparent platform floating high above a gleaming futuristic city. Buildings of glass and light rise in every direction. Flying vehicles move silently between the towers. Gardens grow on every rooftop — green and impossible in the middle of all that silver and glass.\n\n\"People still made gardens,\" [Name] notices. \"Even in the future. Even surrounded by all of this — they still wanted things to grow.\"\n\nA flying vehicle glides past at eye level. Inside, a small child — about [Name]''s age — presses their face to the window and waves.\n\n[Name] waves back.\n\nSome things, it turns out, do not change.",
        "base_photo": "8-the-far-future.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the future city photo with the child in the white background. Match the pose of the child on the floating platform above the future city. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 9,
        "headline": "One More Stop",
        "script_text": "The backpack glows.\n\nNot white. Not blue. Every colour at once — shifting and shimmering, cycling through every era [Name] has visited. Dinosaur green. Egypt gold. Japanese pink. Future silver.\n\nThe compass is spinning fast.\n\n\"One more,\" the compass seems to say. Just one more stop before home.\n\n[Name] closes their eyes and thinks of the most important place in history they have not visited yet.\n\n\"The very beginning,\" [Name] says quietly. \"When the Earth was brand new.\"\n\nThe world goes white.",
        "base_photo": "9-one-more-stop.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the glowing backpack photo with the child in the white background. Match the pose of the child holding the glowing backpack before the final jump. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 10,
        "headline": "Home",
        "script_text": "The attic.\n\nDust. Stillness. The golden afternoon light exactly where it was before.\n\n[Name] sits down on an old trunk, backpack on both shoulders, and looks around at the familiar wooden walls and covered furniture.\n\nThe compass has stopped spinning. The hourglass has gone still.\n\nEverything is exactly as it was — except [Name] is not exactly the same.\n\n[Name] has seen the Earth when it was young. Has stood beside creatures that no longer exist. Has watched pyramids being built and cherry blossoms fall and rooftop gardens grow in a future not yet arrived.\n\n[Name] looks at the backpack in their lap. The patches seem to have changed — new ones now, ones that were not there before.\n\nA Triceratops. A pyramid. A Roman arch. A samurai helmet. A wooden sheriff sign. A glass tower.\n\nSix new patches. Six new memories.",
        "base_photo": "10-home.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the attic return photo with the child in the white background. Match the pose of the child sitting with the backpack in the attic. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      }
    ]
  }'::jsonb
WHERE title = 'The Time Traveler''s Backpack';
