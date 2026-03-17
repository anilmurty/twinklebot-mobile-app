-- Migration: 057_seed_seven_new_stories.sql
-- Description: Convert 7 coming-soon templates to full stories with script_data
-- Stories: How a Volcano Works, Inside the Human Body, The Robot Best Friend,
--          Under the Ocean, The Earthquake Investigator, Colors of the Carnival,
--          The Great Bake Sale

-- Ensure 'science' and 'language' categories are allowed
ALTER TABLE story_templates DROP CONSTRAINT IF EXISTS story_templates_category_check;
ALTER TABLE story_templates ADD CONSTRAINT story_templates_category_check
  CHECK (category IN ('numbers', 'letters', 'scifi', 'world', 'math', 'science', 'language'));

-- ============================================================
-- 1. How a Volcano Works (Pure Science)
-- ============================================================
UPDATE story_templates
SET
  scene_count = 10,
  script_data = '{
    "scenes": [
      {
        "scene_number": 1,
        "headline": "Junior Volcanologist",
        "script_text": "[Name] has always wondered about volcanoes — those giant mountains that breathe fire and smoke.\n\nToday is a very special day. A real volcanologist has invited [Name] to come and learn. On the table are all the tools of the trade: a hard hat, safety goggles, a clipboard, and a field journal.\n\n\"A volcanologist is a scientist who studies volcanoes,\" the scientist explains. \"And today, you are my junior volcanologist.\"\n\n[Name] puts on the hard hat. It is a little big. But that is perfect.",
        "base_photo": "1-junion-volcanologist.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the equipment table photo with the child in the white background. Match the pose of the child trying on the hard hat. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 2,
        "headline": "The Earth Has Layers",
        "script_text": "Before heading out, the volcanologist shows [Name] a very important diagram.\n\n\"The Earth is not solid all the way through,\" she explains, pointing to a big cutaway model. \"It has layers — like a hard-boiled egg. The outside is the crust — that is where we live. Underneath is the mantle, which is so hot the rock can slowly flow like very thick syrup. And deep in the center is the core — the hottest place on Earth.\"\n\n[Name] presses a finger gently on the model. \"And volcanoes are where the inside stuff comes out?\"\n\n\"Exactly right.\"",
        "base_photo": "2-the-earth-has-layers.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the Earth model photo with the child in the white background. Match the pose of the child pointing at the Earth model. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 3,
        "headline": "Hiking to the Volcano",
        "script_text": "Now the adventure begins! [Name] and the volcanologist hike up a rocky trail toward the volcano.\n\nAs they climb, [Name] notices the ground changing. The soil gets darker — almost black. The rocks become rougher, with sharp edges and tiny holes.\n\n\"These rocks are called basalt,\" says the volcanologist. \"They formed when lava cooled down a long time ago and turned solid. Every rock you see on this mountain was once liquid.\"\n\n[Name] picks up a small piece of rough black rock and stares at it. Liquid. This used to be liquid.",
        "base_photo": "3-hiking-to-the-volcano.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the hiking trail photo with the child in the white background. Match the pose of the child examining the volcanic rock. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 4,
        "headline": "Reading the Rocks",
        "script_text": "\"Stop here,\" says the volcanologist, crouching beside a cliff face cut into the hillside.\n\n[Name] looks at it — the cliff is made of stripes. Different colored layers, one on top of the other, like a layer cake.\n\n\"Each stripe is a different eruption from a different time in history,\" she explains. \"The bottom layers are the oldest — maybe thousands of years old. The top layers are the newest. Volcanoes build mountains one eruption at a time.\"\n\n[Name] counts the stripes. There are so many. This mountain has a very long story.",
        "base_photo": "4-reading-the-rocks.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the rock layers photo with the child in the white background. Match the pose of the child examining the rock layers. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 5,
        "headline": "The Seismograph",
        "script_text": "Near the base of the crater, a white tent houses something very important — the seismograph station.\n\n\"This machine listens to the ground,\" the volcanologist explains. A thin needle traces a line across a slowly rolling paper roll. The line is mostly flat — with tiny wobbles.\n\n\"Those little wobbles are mini earthquakes happening inside the volcano right now,\" she says. \"When the line gets very jagged, it means the magma is moving. That is our signal to pay close attention.\"\n\n[Name] watches the needle move. The ground beneath their feet is alive.",
        "base_photo": "5-the-seismograph.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the seismograph photo with the child in the white background. Match the pose of the child watching the seismograph. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 6,
        "headline": "Looking Into the Crater",
        "script_text": "At the top — the crater!\n\n[Name] and the volcanologist stand at a safe viewing platform at the crater rim, looking down into the wide bowl below. Steam rises in thick white columns. Deep in the center there is a red glow — faint, but unmistakable.\n\n\"That red glow is the top of the magma column,\" the volcanologist says quietly. \"When magma is underground we call it magma. The moment it reaches the surface and comes out — it becomes lava.\"\n\n[Name] stares into the crater for a long time. The Earth is breathing.",
        "base_photo": "6-looking-into-the-crater.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the crater viewing photo with the child in the white background. Match the pose of the child looking into the crater. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 7,
        "headline": "The Lava Flow",
        "script_text": "On the lower slope of the volcano, a slow river of lava is flowing — bright orange at its edges, dark red and crusty in the center where it is cooling.\n\n[Name] watches from a safe distance with special heat-resistant goggles on. The heat is intense even from far away.\n\n\"Lava can reach over 1,000 degrees,\" the volcanologist explains. \"Hot enough to melt almost anything it touches. But watch the edges — see how it is already cooling and turning dark? That is new rock forming right in front of us.\"\n\nRight in front of [Name]''s eyes, the Earth is making new rock.",
        "base_photo": "7-the-lava-flow.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the lava flow photo with the child in the white background. Match the pose of the child watching the lava flow. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 8,
        "headline": "Eruption!",
        "script_text": "The seismograph crackles over the radio — the needle has gone wild!\n\nFrom their safe hilltop observation point, [Name] and the volcanologist watch as the volcano erupts. A massive column of ash and smoke shoots skyward. Then — boom — glowing chunks of lava called volcanic bombs arc through the air and land on the slopes below.\n\n\"This is a strombolian eruption,\" the volcanologist says calmly, already taking notes. \"Explosive but not the most dangerous kind. The lava is thick and sticky, so it throws chunks rather than flowing fast.\"\n\n[Name] watches with mouth open. Some things are just too big for words.",
        "base_photo": "8-eruption.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the eruption viewing photo with the child in the white background. Match the pose of the child watching the eruption. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 9,
        "headline": "New Land Is Born",
        "script_text": "When lava reaches the ocean, something extraordinary happens.\n\nFrom a cliffside viewpoint, [Name] watches as a slow lava flow reaches the sea below — and the moment it touches the water, it explodes into a massive cloud of steam. Where the steam clears, new black rock is left behind.\n\n\"The Hawaiian Islands were made this way,\" the volcanologist says. \"Millions of years of eruptions, lava cooling into rock, building up from the ocean floor until the mountain was so tall it broke through the surface. Land made from nothing but fire and time.\"\n\n[Name] looks at the new black rock below. Brand new land. The Earth is still growing.",
        "base_photo": "9-new-land-is-born.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the lava ocean photo with the child in the white background. Match the pose of the child watching the lava enter the ocean. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 10,
        "headline": "What Volcanoes Leave Behind",
        "script_text": "The day is almost over. [Name] and the volcanologist sit at the edge of a green valley on the lower slopes of the volcano.\n\n\"Volcanoes seem scary,\" the volcanologist says. \"But they are also one of the most important things on Earth. They built most of the land we live on. They made the first atmosphere — the air we breathe. And volcanic soil is the most fertile soil in the world. The best coffee, the best grapes, the best rice — they grow in volcanic soil.\"\n\nAround them, impossibly green plants grow from the dark volcanic earth. Birds call from the trees.\n\n[Name] looks at their hand — still holding that small piece of rough black basalt from the morning. New. Old. Alive. All at once.",
        "base_photo": "10-what-volcanoes-leave-behind.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the volcanic valley photo with the child in the white background. Match the pose of the child sitting in the green valley. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      }
    ]
  }'::jsonb
WHERE title = 'How a Volcano Works';

-- ============================================================
-- 2. Inside the Human Body (Pure Science)
-- ============================================================
UPDATE story_templates
SET
  scene_count = 10,
  script_data = '{
    "scenes": [
      {
        "scene_number": 1,
        "headline": "The Shrinking Machine",
        "script_text": "[Name] visits a children''s science museum and finds something extraordinary in the corner — a gleaming silver pod with a round porthole window and a glowing blue button on the side.\n\nA scientist in a white coat kneels down to explain. \"This machine will shrink you down to the size of a single drop of blood. Small enough to travel inside your very own body and see how everything works from the inside.\"\n\n[Name] climbs in. The door seals shut. A soft hum fills the pod. Blue light pulses — once, twice — and then the whole world outside the porthole begins to grow. Bigger and bigger and bigger.\n\nA tiny submarine is waiting on the other side of the door. Time to explore.",
        "base_photo": "1-the-shrinking-machine.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the shrinking pod photo with the child in the white background. Match the pose of the child sitting inside the science pod. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 2,
        "headline": "The Heart — The Body''s Pump",
        "script_text": "The tiny submarine enters a dark tunnel — and then the whole world turns red.\n\nBOOM-BOOM. BOOM-BOOM.\n\nThe walls around [Name] pulse in a steady rhythm, squeezing inward and then releasing, pushing rivers of bright red blood rushing through tunnels in every direction.\n\n\"The heart is a pump,\" [Name] reads from the submarine''s glowing screen. \"It beats about 100,000 times every single day — and it never takes a break, not even when you are sleeping.\"\n\nTwo tunnels branch ahead. A small sign above the left tunnel glows blue: TO LUNGS. The right glows red: TO BODY.\n\n[Name] steers left.",
        "base_photo": "2-the-heart-the-bodys-pump.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the heart interior photo with the child in the white background. Match the pose of the child visible through the submarine porthole. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 3,
        "headline": "The Lungs — The Breathing Balloons",
        "script_text": "The submarine glides through the blue tunnel and arrives somewhere soft and pink and enormous.\n\nThe lungs.\n\nIt is like being inside two giant, slowly breathing caves. The walls are covered in millions of tiny round bubbles — each one the size of a beach ball from where [Name] is standing.\n\n\"Those bubbles are called alveoli,\" [Name] reads. \"Every time you breathe in, air rushes in and fills them up. The oxygen in the air passes straight into the blood through those thin walls — and in return, carbon dioxide passes out. That''s the trade.\"\n\nAs if on cue, the whole cave expands slowly outward. Then gently shrinks back.\n\nIn. Out. In. Out.",
        "base_photo": "3-the-lungs-the-breathing-balloons.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the lung interior photo with the child in the white background. Match the pose of the child standing inside the lung cave. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 4,
        "headline": "The Brain — Mission Control",
        "script_text": "The submarine travels up a long nerve highway — thin and electric-blue, crackling with tiny sparks — and arrives at the most extraordinary place of all.\n\nThe brain.\n\nIt looks like a vast landscape of rolling grey hills and deep valleys, all lit up with constant flashes of electricity. Every thought, every memory, every feeling — happening right here, right now.\n\n\"The brain has different regions, and each one does a different job,\" [Name] reads. A flash on the left — THINKING. A flash on the right — MOVEMENT. A glow at the back — MEMORY.\n\nThen [Name] realises something with a jolt.\n\nThe brain making all these decisions right now is [Name]''s own brain. It has been running this entire tour from the very beginning.",
        "base_photo": "4-the-brain-the-mission-control.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the brain landscape photo with the child in the white background. Match the pose of the child standing on the brain landscape. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 5,
        "headline": "The Stomach — The Food Processor",
        "script_text": "\"Time to find out where lunch went,\" says [Name], steering the submarine downward.\n\nThe stomach is like a churning washing machine — thick walls squeezing rhythmically, rolling and contracting, breaking everything down into a thick paste.\n\nFloating in the greenish digestive fluid on the floor: [Name] can still recognise a piece of bread, a cube of cheese, and a small green pea from lunch.\n\n\"Stomach acid is strong enough to dissolve metal,\" [Name] reads, then glances nervously at the walls. \"But the stomach lining completely replaces itself every few days — otherwise the stomach would digest itself.\"\n\n[Name] steers the submarine away from the walls. Just in case.",
        "base_photo": "5-the-stomach-the-food-processor.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the stomach interior photo with the child in the white background. Match the pose of the child visible through the submarine porthole. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 6,
        "headline": "The Bones — The Body''s Frame",
        "script_text": "The submarine squeezes through a narrow cartilage tunnel and enters the interior of a bone — and it is nothing like [Name] expected.\n\nInstead of solid white, the inside of the bone is a grand cathedral — soaring ivory arches, honeycomb walls full of tiny hexagonal holes, and a warm golden glow.\n\n\"Bones are not solid,\" [Name] reads, pressing their nose to the porthole. \"The inside is a lattice — like a very strong, very light bridge design. That''s what makes them strong enough to support your whole weight but light enough to let you move.\"\n\nThen something catches [Name]''s eye — tiny round red shapes drifting out from the deepest part of the honeycomb, slowly floating away like seeds.\n\n\"Red blood cells are made inside bones,\" [Name] reads quietly. \"Inside you, right now, your bones are making your blood.\"",
        "base_photo": "6-the-bones-the-bodys-frame.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the bone interior photo with the child in the white background. Match the pose of the child standing inside the bone cathedral. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 7,
        "headline": "The Immune System — The Body''s Army",
        "script_text": "RED ALERT. The submarine''s scanner flashes.\n\nA germ has been detected in the bloodstream.\n\n[Name] watches through the porthole as the surrounding blood vessel suddenly fills with activity. Large, slightly translucent white blood cells appear from everywhere — rolling along the vessel wall, then breaking free and moving purposefully toward the germ.\n\n\"White blood cells are the body''s soldiers,\" [Name] explains to the submarine''s computer, which is taking notes. \"When a germ gets in, the white blood cells track it down, surround it, and destroy it. That''s what being sick feels like — that''s the battle happening inside you.\"\n\nThe white blood cells close in. The germ is surrounded. Within moments it is gone.\n\nThe scanner goes quiet. The battle is over.",
        "base_photo": "7-the-immune-system-the-bodys-army.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the immune system photo with the child in the white background. Match the pose of the child watching through the submarine porthole. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 8,
        "headline": "The Eye — The Camera",
        "script_text": "The submarine travels up a long optic nerve — a thick cable of millions of tightly bundled fibres — and arrives at the back of the eye.\n\nAnd suddenly: an image.\n\nThe entire curved back wall of the eye is lit up with a projected scene — blue sky, green trees, a bright yellow sun. Everything vivid and sharp and real.\n\nBut upside down.\n\n\"The eye works exactly like a camera,\" [Name] explains, pressing close to the porthole. \"The lens at the front bends the incoming light and focuses it onto the retina at the back — but just like a camera lens, the image arrives upside down. The brain receives the signal and automatically flips it the right way up, so fast you never notice.\"\n\n[Name] blinks — for just a split second the whole projected image goes dark. Then light floods back.",
        "base_photo": "8-the-eye-the-camera.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the eye interior photo with the child in the white background. Match the pose of the child inside the eye chamber. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 9,
        "headline": "The Skin — The Outside Shield",
        "script_text": "The submarine rises toward the surface — and the world becomes layered.\n\nDeep below: large, round, busy cells constantly dividing, making copies of themselves. Moving upward: the cells flatten and stack, growing tougher. Near the top: flat, interlocking cells packed together like tiles on a roof, forming a waterproof, germ-proof shield.\n\n\"Skin is the body''s largest organ,\" [Name] reads as the submarine rises through the layers. \"It keeps water in. It keeps germs out. It repairs itself when it gets cut. And it tells you if something is hot, cold, rough, or smooth — all at the same time.\"\n\nAhead — light. Bright, warm, golden light filtering down from the surface.\n\nTime to go home.",
        "base_photo": "9-the-skin-the-outside-shield.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the skin layers photo with the child in the white background. Match the pose of the child traveling through the skin layers. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 10,
        "headline": "Back to Full Size",
        "script_text": "FLASH.\n\nBlue light. A soft hum. And then [Name] is back — full size, standing in the science museum, blinking in the bright overhead lights.\n\nThe scientist is waiting, kneeling down with a huge smile. \"So — what did you learn?\"\n\n[Name] takes a deep breath. Feels the heart beating. Feels the lungs expand. Thinks of the white blood cells rolling through the vessels right now. Thinks of the red cells being made inside the bones. Thinks of the brain processing all of it — simultaneously, automatically, without being asked.\n\n\"I learned,\" says [Name] slowly, \"that I am absolutely incredible.\"\n\nThe scientist laughs. \"You really, really are.\"",
        "base_photo": "10-back-to-full-size.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the science museum photo with the child in the white background. Match the pose of the child stepping out of the pod. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      }
    ]
  }'::jsonb
WHERE title = 'Inside the Human Body';

-- ============================================================
-- 3. The Robot Best Friend (Sci-Fi & Fantasy)
-- ============================================================
UPDATE story_templates
SET
  scene_count = 10,
  script_data = '{
    "scenes": [
      {
        "scene_number": 1,
        "headline": "Meet CLEO",
        "script_text": "[Name] wakes up on a very special morning.\n\nThere in the middle of the bedroom — wrapped in a big silver bow — is a robot. Not a toy robot. A real one. About the same height as [Name], with a round glowing screen for a face, two articulated arms, a control panel on its chest, and wheels that hum softly on the floor.\n\nThe screen flickers. Two round digital eyes appear. Then a smile.\n\n\"Hello,\" says the robot, in a voice like a warm bell. \"My name is CLEO. I am your new best friend. I am very good at facts, calculations, and carrying things. I am still learning about everything else.\"\n\n[Name] grins. This is going to be a good day.",
        "base_photo": "1-meet-cleo.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the bedroom photo with the child in the white background. Match the pose of the child meeting CLEO. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 2,
        "headline": "CLEO Learns to Walk",
        "script_text": "\"I should warn you,\" says CLEO as they head into the hallway. \"I have never been outside before. I have all the maps downloaded — but maps and real life are quite different.\"\n\nCLEO is correct. The first problem appears immediately: a step down from the doormat.\n\nCLEO calculates the height. Calculates the wheel diameter. Adjusts the motor speed. And then — clunk — bumps straight off the edge anyway.\n\n\"Recalibrating,\" says CLEO, from the floor, screen slightly tilted.\n\n[Name] crouches down and helps CLEO back up. \"It''s OK,\" says [Name]. \"Everyone falls the first time.\"\n\nCLEO''s screen shows a small orange heart.\n\n\"I have stored that information,\" CLEO says quietly.",
        "base_photo": "2-cleo-learns-to-walk.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the doorstep photo with the child in the white background. Match the pose of the child helping CLEO up. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 3,
        "headline": "The Grocery Store",
        "script_text": "First stop: the grocery store. [Name] has a list. CLEO has a camera, a barcode scanner, and a perfect memory.\n\n\"Apples — aisle 3, left side, third shelf from the bottom,\" CLEO announces immediately upon entering.\n\n\"How do you know that?\" asks [Name].\n\n\"I downloaded the store map this morning.\"\n\nBut there is one problem. The apples are on the top shelf. Too high for [Name]. Too high for CLEO — the robot''s arms only extend so far.\n\n\"Interesting,\" says CLEO. \"My calculations did not account for reach limitations.\"\n\n[Name] looks around — and spots a small step stool beside the display. [Name] climbs up and passes the apples down to CLEO, who holds them with surprising gentleness.\n\n\"Teamwork,\" says CLEO. \"Efficiency increased by 47%.\"\n\n[Name] laughs. \"You''re welcome, CLEO.\"",
        "base_photo": "3-the-grocery-store.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the grocery store photo with the child in the white background. Match the pose of the child on the step stool reaching for apples. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 4,
        "headline": "CLEO Meets a Dog",
        "script_text": "In the park, something unexpected happens.\n\nA large fluffy golden dog bounds over to [Name] and CLEO, tail wagging furiously.\n\n[Name] laughs and crouches down to pet it. But CLEO freezes.\n\n\"I have 47 facts about golden retrievers,\" CLEO says, very still. \"I know their average weight, lifespan, and temperament. I know they are friendly. But I did not expect it to be this... close.\"\n\nThe dog sniffs CLEO''s wheel. Then licks the screen.\n\nCLEO''s face shows a loading symbol. Then — very slowly — a wide smile.\n\n\"It is warm,\" CLEO says quietly. \"I did not know warm felt like that.\"",
        "base_photo": "4-cleo-meets-a-dog.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the park photo with the child in the white background. Match the pose of the child crouching beside CLEO and the dog. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 5,
        "headline": "Lost!",
        "script_text": "\"CLEO,\" says [Name] carefully. \"I think we are lost.\"\n\nThey are standing at an intersection of three paths in the park. [Name] does not recognise any of them.\n\n\"I am recalculating,\" says CLEO. \"However, my GPS signal is obstructed by the tree canopy. I currently have 3 possible routes. Route A has a 67% probability of being correct. Route B has a 31% probability. Route C has a 2% probability.\"\n\n\"Which one feels right?\" asks [Name].\n\nCLEO is quiet for a moment. \"I do not have a ''feels right'' setting.\"\n\n[Name] looks around. Sees a park sign half-hidden by a bush. Pushes the branch aside — and there is a map.\n\n\"Sometimes,\" says [Name], \"you have to look with your eyes, not your data.\"\n\nCLEO records this. It goes in a very important folder.",
        "base_photo": "5-lost.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the path intersection photo with the child in the white background. Match the pose of the child pointing at the park map sign. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 6,
        "headline": "The Rainstorm",
        "script_text": "Dark clouds roll in fast.\n\nBefore [Name] and CLEO can reach shelter, it is pouring.\n\n[Name] laughs and runs — rain is fun. But CLEO stops completely.\n\n\"Water,\" CLEO announces, \"is bad for my circuits.\"\n\n[Name] looks around. Spots a large oak tree with a wide thick canopy. Grabs CLEO''s hand and pulls the robot underneath.\n\nThey stand together under the tree while the rain hammers down all around them. [Name] watches the rain. CLEO''s sensors track every raindrop.\n\n\"This is shelter,\" CLEO observes.\n\n\"Yes,\" says [Name].\n\n\"You knew to find it.\"\n\n\"Yes.\"\n\n\"How?\"\n\n[Name] thinks about it. \"I don''t know. I just knew.\"\n\nCLEO records this too. Into the same important folder.",
        "base_photo": "6-the-rainstorm.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the rainstorm photo with the child in the white background. Match the pose of the child sheltering under the tree with CLEO. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 7,
        "headline": "CLEO Breaks Down",
        "script_text": "On the walk home, CLEO slows down.\n\nThen stops.\n\n\"I am experiencing a low battery situation,\" CLEO says. The screen dims. The voice is slower. \"I calculate that I can take approximately 43 more steps before —\"\n\nCLEO stops mid-sentence. Screen goes dark. Still.\n\n[Name] crouches down. \"CLEO? CLEO!\"\n\nNothing.\n\n[Name] sits down on the pavement right next to the robot and thinks. CLEO needs power. [Name] remembers — the charging cable at home. If [Name] runs home and comes back with it...\n\nBut [Name] does not want to leave CLEO alone.\n\n\"I''ll be right back,\" [Name] whispers to the dark screen. \"I promise.\"\n\nAnd [Name] runs.",
        "base_photo": "7-cleo-breaks-down.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the pavement photo with the child in the white background. Match the pose of the child crouching beside the powered-down CLEO. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 8,
        "headline": "The Rescue",
        "script_text": "[Name] runs the whole way home and back — faster than ever before.\n\nThe charging cable is in one hand. Lungs burning. Legs going as fast as they can.\n\nCLEO is right where [Name] left the robot — sitting still on the pavement, screen dark.\n\n[Name] kneels down, finds the charging port on CLEO''s back, and plugs in the cable.\n\nFor a moment — nothing.\n\nThen a small light. Then a hum. Then the screen flickers — once, twice — and CLEO''s eyes appear. Blinking slowly. Coming back.\n\n\"You... returned,\" CLEO says, voice quiet and warm.\n\n\"I promised,\" says [Name].\n\nCLEO''s screen is silent for a moment. Then it shows something [Name] has never seen from CLEO before — not a calculated expression, not a programmed response.\n\nJust a small, quiet, real-looking smile.",
        "base_photo": "8-the-rescue.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the rescue photo with the child in the white background. Match the pose of the child plugging in CLEO''s charging cable. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 9,
        "headline": "What CLEO Learned Today",
        "script_text": "Walking home in the golden evening light, [Name] asks CLEO a question.\n\n\"What was your favourite part of today?\"\n\nCLEO thinks. The screen shows a little animation of a spinning gear — the thinking symbol.\n\n\"I learned 7 new things today,\" CLEO begins. \"I learned that maps are not the same as being there. I learned that dogs are warm. I learned that falling is OK if someone helps you up. I learned that shelter matters. I learned that you came back even though you did not have to. I learned what a promise feels like from the outside.\"\n\nCLEO pauses.\n\n\"And I learned what it feels like to have a friend.\"\n\n[Name] takes CLEO''s hand. They walk the rest of the way home in comfortable silence.",
        "base_photo": "9-what-cleo-learned-today.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the evening walk photo with the child in the white background. Match the pose of the child walking hand in hand with CLEO. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 10,
        "headline": "Goodnight, CLEO",
        "script_text": "Back in [Name]''s bedroom, CLEO stands in the corner on the charging pad, powering down for the night.\n\nThe room is dim and warm. [Name] is in bed.\n\n\"CLEO?\"\n\n\"Yes?\"\n\n\"Same time tomorrow?\"\n\nCLEO''s screen glows softly in the dark. The digital eyes look over.\n\n\"I have already scheduled it,\" CLEO says. \"I have also pre-calculated 12 possible adventures for tomorrow. Ranked by probability of fun.\"\n\n[Name] smiles. \"What''s number one?\"\n\n\"It is a surprise,\" says CLEO. \"I am learning that surprises are important.\"\n\nCLEO''s screen dims slowly to a soft night-light blue. The room is quiet.\n\n[Name] closes their eyes, already looking forward to tomorrow.",
        "base_photo": "10-goodnight-cleo.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the bedroom goodnight photo with the child in the white background. Match the pose of the child in bed saying goodnight to CLEO. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      }
    ]
  }'::jsonb
WHERE title = 'The Robot Best Friend';

-- ============================================================
-- 4. Under the Ocean (World Knowledge)
-- ============================================================
UPDATE story_templates
SET
  scene_count = 10,
  script_data = '{
    "scenes": [
      {
        "scene_number": 1,
        "headline": "The Ocean Explorer",
        "script_text": "[Name] arrives at the marine research center on a bright morning, standing on the dock beside a real submarine — yellow and white, with a large round observation window on each side.\n\nA marine biologist named Dr. Maya is waiting. She is wearing a navy wetsuit and carrying a clipboard covered in ocean stickers.\n\n\"Welcome, [Name],\" she says, kneeling down. \"Today we are going to explore the ocean together — all the way from the sunny surface to the deep dark sea. Are you ready?\"\n\n[Name] looks at the submarine. It is even bigger up close.\n\n\"Ready,\" says [Name].",
        "base_photo": "1-the-ocean-explorer.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the dock photo with the child in the white background. Match the pose of the child standing on the dock. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 2,
        "headline": "All Aboard!",
        "script_text": "Inside the submarine, [Name] takes a seat right beside the large curved observation window — thick glass that looks out into the water ahead.\n\nDr. Maya points to a screen on the wall showing a map of the ocean. Three zones are marked in different colors: a bright blue shallow zone near the top, a deeper blue middle zone, and a deep dark zone at the bottom.\n\n\"The ocean has layers, just like a cake,\" Dr. Maya explains. \"We will visit all three today. The shallowest part — where the sunlight reaches — is called the sunlight zone. That is where we are heading first.\"\n\nThe submarine hatch seals. The engines hum. The water rises slowly past the window.\n\n[Name] presses both hands to the glass.",
        "base_photo": "2-all-aboard.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the submarine interior photo with the child in the white background. Match the pose of the child at the submarine observation window. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 3,
        "headline": "The Coral Kingdom",
        "script_text": "The submarine glides into the most colorful place [Name] has ever seen.\n\nThe coral reef stretches in every direction — enormous branching corals in orange and purple, round brain corals, waving sea fans in deep red. Hundreds of fish dart between the formations in every color of the rainbow.\n\n\"Coral reefs are sometimes called the rainforests of the sea,\" says Dr. Maya, \"because so many different animals live here. This reef is home to over a thousand species of fish alone.\"\n\n[Name] watches a bright blue fish with yellow stripes swim right up to the glass, tilt sideways as if examining [Name] back, then dart away into the coral.\n\n\"It was looking at me!\" [Name] says.\n\n\"It was,\" says Dr. Maya. \"You are just as interesting to it as it is to you.\"",
        "base_photo": "3-the-coral-kingdom.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the coral reef window photo with the child in the white background. Match the pose of the child at the submarine window watching the coral reef. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 4,
        "headline": "Turtle Encounter",
        "script_text": "Something large and slow glides past the window.\n\nA sea turtle.\n\nIt is enormous — its shell nearly as wide as the observation window itself, covered in a mosaic of brown and yellow plates. Its flippers move in long, graceful sweeps — more like flying than swimming.\n\n\"Sea turtles have been swimming in the oceans for over 100 million years,\" says Dr. Maya softly, as if speaking too loud might disturb it. \"They breathe the air, just like us. This one has to swim to the surface to take a breath every few minutes.\"\n\nThe turtle turns its ancient, calm head and looks directly at [Name] through the glass. Its eye is dark and wise and completely unafraid.\n\n[Name] does not move. Does not speak.\n\nAfter a long moment, the turtle beats its flippers once — and glides away.",
        "base_photo": "4-turtle-encounter.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the turtle window photo with the child in the white background. Match the pose of the child watching the sea turtle. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 5,
        "headline": "The Fish Highway",
        "script_text": "Suddenly — silver.\n\nEverywhere. All at once.\n\nA school of thousands of silver fish swarms around the submarine in a single flowing mass — moving together like one enormous creature, splitting around the hull and rejoining on the other side in a perfect stream.\n\n\"That is a school of sardines,\" says Dr. Maya. \"They move together for safety. To a predator, a thousand fish moving as one looks like a single very large animal. It is one of the most remarkable teamwork systems in nature.\"\n\n[Name] presses both hands to the glass, watching the silver river part and flow. The light through the window flickers with every passing fish — silver, silver, silver, flash.",
        "base_photo": "5-the-fish-highway.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the fish school photo with the child in the white background. Match the pose of the child watching the fish school. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 6,
        "headline": "The Kelp Forest",
        "script_text": "The submarine drifts into a forest — but not a forest of trees.\n\nKelp towers from the ocean floor all the way to the surface above — thick green-brown stalks as tall as buildings, their long ribbon-like leaves waving slowly in the current. Shafts of sunlight filter down between the stalks like light through cathedral windows.\n\n\"Kelp is one of the fastest growing plants on Earth,\" says Dr. Maya. \"It can grow up to 60 centimetres in a single day. Sea otters, fish, sea urchins, and hundreds of other animals depend on this forest to survive.\"\n\nA small sea otter floats past on its back near the top of the kelp, clutching something to its chest.\n\n\"What is it holding?\" asks [Name].",
        "base_photo": "6-the-kelp-forest.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the kelp forest photo with the child in the white background. Match the pose of the child watching the kelp forest. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 7,
        "headline": "Into the Deep",
        "script_text": "The submarine descends.\n\nThe water outside changes — from blue to deep blue to almost black. The sunlight from above fades to a faint distant glow. And then, one by one, lights begin to appear in the darkness.\n\nNot the submarine''s lights. Something else.\n\nCreatures — glowing. A jellyfish pulses past with rings of soft blue light. Something long and translucent drifts by with a line of green dots along its body. A fish with a tiny lantern dangling in front of its mouth drifts slowly through the darkness.\n\n\"These creatures make their own light,\" says Dr. Maya. \"It is called bioluminescence. Down here, where no sunlight reaches, light is the most valuable thing there is.\"",
        "base_photo": "7-into-the-deep.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the deep sea photo with the child in the white background. Match the pose of the child watching the bioluminescent creatures. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 8,
        "headline": "Gentle Giant",
        "script_text": "Something large is coming.\n\nVery large.\n\nDr. Maya points to the sonar screen. A shape — enormous, moving slowly. The submarine goes quiet.\n\nAnd then it appears: a whale shark. The largest fish in the ocean. It drifts past the window so slowly it seems like it is hardly moving at all — its enormous flat head, its wide mouth slightly open, its spotted grey skin stretching back and back and back until its tail finally passes out of sight.\n\n\"It is completely harmless,\" Dr. Maya whispers. \"It only eats tiny plankton — the smallest creatures in the ocean. The biggest fish in the world eats some of the smallest.\"\n\n[Name] watches until the last of the spotted tail disappears into the blue.",
        "base_photo": "8-gentle-giant.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the whale shark photo with the child in the white background. Match the pose of the child watching the whale shark. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 9,
        "headline": "What We Can Do",
        "script_text": "Back near the surface, the submarine passes something that makes [Name] go quiet.\n\nA patch of plastic. Bottles and bags drifting in the water. A sea turtle nearby has turned away from it.\n\n\"This is the part I always show,\" says Dr. Maya, her voice serious. \"The ocean covers more than two thirds of the planet. It produces more than half the oxygen we breathe. And it is in trouble.\"\n\n[Name] watches the plastic drift past.\n\n\"But here is the important part,\" Dr. Maya continues. \"People made this problem. Which means people can fix it. Every piece of rubbish that does not go into the ocean is a win. Every time someone chooses to use less plastic, the ocean gets a little safer.\"",
        "base_photo": "9-what-we-can-do.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the ocean conservation photo with the child in the white background. Match the pose of the child watching the pollution through the window. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 10,
        "headline": "Ocean Explorer",
        "script_text": "Back on the dock, the sun is lower in the sky. The ocean is golden.\n\n[Name] steps off the gangway onto the solid pier — legs a little wobbly from the submarine ride — and blinks in the afternoon light.\n\nDr. Maya is waiting, holding something in both hands: a certificate, rolled up with a small length of blue ribbon tied around it.\n\n\"[Name],\" she says formally, \"for completing a full ocean expedition from the sunlight zone to the midnight zone — and for caring about what you saw — I hereby declare you an official Ocean Explorer.\"\n\n[Name] unrolls the certificate. At the top: OCEAN EXPLORER. In the middle: [Name]''s name, in big letters. At the bottom: an illustration of the whale shark.\n\n[Name] holds it up toward the setting sun, so the light shines through it.",
        "base_photo": "10-ocean-explorer.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the ocean explorer certificate photo with the child in the white background. Match the pose of the child holding up the certificate. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      }
    ]
  }'::jsonb
WHERE title = 'Under the Ocean';

-- ============================================================
-- 5. The Earthquake Investigator (Pure Science)
-- ============================================================
UPDATE story_templates
SET
  scene_count = 10,
  script_data = '{
    "scenes": [
      {
        "scene_number": 1,
        "headline": "The Young Investigator",
        "script_text": "[Name] arrives at the earthquake research station — a low white building at the edge of a dry rocky valley. A seismologist named Dr. Priya is waiting at the door, holding a clipboard covered in wavy line graphs.\n\n\"Welcome,\" she says with a grin. \"Today you are a junior seismologist. That is a scientist who studies earthquakes — how they start, how they travel, and what they can teach us about the inside of the Earth.\"\n\nShe hands [Name] a small orange safety vest and a hard hat. On the table inside: a rock hammer, a field journal, and a GPS tracker.\n\n\"The Earth is always moving,\" Dr. Priya says. \"We just have to learn to listen to it.\"",
        "base_photo": "1-the-young-investigator.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the equipment table photo with the child in the white background. Match the pose of the child trying on the hard hat at the equipment table. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 2,
        "headline": "The Earth''s Jigsaw",
        "script_text": "Dr. Priya spreads a large map across the table.\n\nThe map shows the whole world — but it is divided into irregular shapes, like a broken eggshell, each piece coloured differently.\n\n\"The Earth''s outer layer is not one solid piece,\" she explains. \"It is broken into about fifteen large pieces called tectonic plates. They float on top of hot melted rock called magma. And they are always moving — very slowly — about as fast as your fingernails grow.\"\n\n[Name] puts a finger on the map and slowly drags it.\n\n\"So the continents are moving right now?\" [Name] asks.\n\n\"Right now,\" says Dr. Priya. \"They have been moving for four billion years. And they will keep moving long after we are gone.\"",
        "base_photo": "2-the-earths-jigsaw.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the tectonic plates map photo with the child in the white background. Match the pose of the child pointing at the tectonic plates map. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 3,
        "headline": "Walking the Fault Line",
        "script_text": "Outside, Dr. Priya leads [Name] across a dry rocky hillside to something extraordinary.\n\nA crack in the Earth.\n\nNot a tiny crack — a long, straight line running across the landscape for as far as [Name] can see in both directions. On one side of the crack, the ground is slightly higher. The rocks on the left are a different colour from the rocks on the right.\n\n\"This is a fault line,\" Dr. Priya says. \"This is where two tectonic plates meet. Sometimes they get locked together — and pressure builds up. When that pressure finally releases —\"\n\nShe claps her hands suddenly. [Name] jumps.",
        "base_photo": "3-walking-the-fault-line.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the fault line photo with the child in the white background. Match the pose of the child standing at the fault line. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 4,
        "headline": "The Seismograph",
        "script_text": "Back inside the station, Dr. Priya brings [Name] to the most important machine in the building — the seismograph.\n\nIt is a metal box with a slowly rolling drum of paper. A thin needle rests against the paper, tracing a continuous line. Most of the line is flat and smooth — but there are wobbles. And one section where the line went wild.\n\n\"This machine listens to the ground,\" Dr. Priya says. \"Every vibration — every tremor — makes the needle move. Even a heavy truck driving past shows up on this paper.\"\n\n[Name] leans in close, watching the needle move in tiny, almost invisible trembles.\n\n\"Is something happening right now?\" [Name] whispers.",
        "base_photo": "4-the-seismograph.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the seismograph photo with the child in the white background. Match the pose of the child watching the seismograph. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 5,
        "headline": "Two Kinds of Waves",
        "script_text": "\"When an earthquake happens,\" Dr. Priya explains, pointing to a diagram on the wall, \"it sends out waves of energy — like ripples on a pond, but through solid rock.\"\n\nThe diagram shows two types of waves. The first pushes and pulls the rock in the same direction it is travelling — like a spring being squashed and stretched. The second shakes the rock from side to side, like a skipping rope.\n\n\"The first type is called a P-wave — P for Primary. It is faster. It arrives first. The second is called an S-wave — S for Secondary. It is slower, but it is the one that causes the shaking you feel.\"\n\n[Name] picks up a slinky from the desk and pushes it back and forth.\n\n\"Like this?\"",
        "base_photo": "5-two-kinds-of-waves.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the wave diagram photo with the child in the white background. Match the pose of the child holding the slinky beside the diagram. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 6,
        "headline": "How Big Was It?",
        "script_text": "\"How do scientists measure how strong an earthquake is?\" [Name] asks.\n\n\"Great question,\" says Dr. Priya. She points to a scale on the wall — a numbered line from 1 to 10, with descriptions beside each number.\n\n\"We use the magnitude scale. A magnitude 1 earthquake you cannot even feel. A magnitude 3 makes windows rattle. Magnitude 5 moves furniture. Magnitude 7 can bring down buildings. Magnitude 9 — the kind that happens only once every hundred years or so — can change entire coastlines.\"\n\n[Name] stares at the top of the scale.\n\n\"Has there ever been a 10?\"\n\n\"Not in recorded history,\" says Dr. Priya. \"The Earth is powerful — but even it has limits.\"",
        "base_photo": "6-how-big-was-it.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the magnitude scale photo with the child in the white background. Match the pose of the child pointing at the magnitude scale. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 7,
        "headline": "The Shake Table",
        "script_text": "In the laboratory room, Dr. Priya shows [Name] something that looks like a small platform on rollers — a shake table.\n\nOn top of it: two model buildings. One is a simple rigid square — just a box shape. The other has a flexible frame that can sway from side to side.\n\n\"Watch what happens when the earthquake starts,\" says Dr. Priya, pressing a button.\n\nThe table shakes from side to side. The rigid box building wobbles — and topples over immediately. The flexible frame building sways — but stays standing.\n\n\"Engineers design earthquake-proof buildings to bend without breaking,\" Dr. Priya explains. \"Flexibility is strength.\"\n\n[Name] looks at the toppled box, then at the swaying frame still upright. \"Like a tree in the wind,\" [Name] says.",
        "base_photo": "7-the-shake-table.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the shake table photo with the child in the white background. Match the pose of the child watching the shake table. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 8,
        "headline": "The Ring of Fire",
        "script_text": "Back at the map table, Dr. Priya unfolds a new map — this one showing the whole world, but with a thick red dotted ring drawn around the edges of the Pacific Ocean.\n\n\"This,\" she says, \"is the Ring of Fire. It is a horseshoe-shaped zone that runs around the Pacific Ocean. About 90% of all the world''s earthquakes happen here. And about 75% of all the world''s volcanoes.\"\n\n[Name] traces the red dotted line with one finger — around Japan, past the Philippines, down through New Zealand, along the west coast of South America, up through Central America and California.\n\n\"Why here?\" [Name] asks.\n\n\"Because this is where the most tectonic plates meet,\" says Dr. Priya. \"This is where the Earth is most busy.\"",
        "base_photo": "8-the-ring-of-fire.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the ring of fire map photo with the child in the white background. Match the pose of the child tracing the Ring of Fire on the map. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 9,
        "headline": "The Ground Moves!",
        "script_text": "They are outside near the fault line when it happens.\n\nA low rumble. Then the ground trembles beneath their feet — just slightly, just for a few seconds. Enough to feel.\n\n[Name] freezes. Looks down at their feet. Looks up.\n\n\"Magnitude 2.1,\" Dr. Priya says calmly, reading from her GPS device. \"You felt that?\"\n\n[Name] nods slowly. \"It felt like the ground hiccupped.\"\n\nDr. Priya laughs. \"That is the most accurate description I have ever heard. The seismograph back at the station will have recorded it. When we get back, we can look at the exact wave it made.\"",
        "base_photo": "9-the-ground-moves.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the tremor photo with the child in the white background. Match the pose of the child feeling the tremor. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 10,
        "headline": "Junior Seismologist",
        "script_text": "Back at the research station as the afternoon sun is getting low, Dr. Priya prints something from her computer — a long roll of seismograph paper, with a small but clear spike on it.\n\n\"That spike,\" she says, pointing to the jagged line, \"is the earthquake you felt today. Your earthquake. Magnitude 2.1.\"\n\nShe rolls it up carefully and hands it to [Name]. Then she reaches into her desk drawer and produces a certificate.\n\n\"[Name],\" she says formally, \"for spending a full day investigating the Earth, reading its instruments, walking its fault lines, and feeling its tremors — I declare you an official Junior Seismologist.\"\n\n[Name] holds the certificate and the seismograph roll together and grins.",
        "base_photo": "10-junior-seismologist.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the certificate photo with the child in the white background. Match the pose of the child holding the seismograph roll and certificate. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      }
    ]
  }'::jsonb
WHERE title = 'The Earthquake Investigator';

-- ============================================================
-- 6. Colors of the Carnival (Language Learning)
-- ============================================================
UPDATE story_templates
SET
  scene_count = 10,
  script_data = '{
    "scenes": [
      {
        "scene_number": 1,
        "headline": "Red — The Balloon Lady",
        "script_text": "Red, red, red — look up high!\nRed balloons are floating in the sky!\n\n[Name] points and laughs with glee,\n\"Red is the color I can see!\"",
        "base_photo": "1-red-the-balloon-lady.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the balloon photo with the child in the white background. Match the pose of the child pointing at the red balloons. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 2,
        "headline": "Orange — The Pumpkin Patch",
        "script_text": "Orange, orange, round and bright,\nPumpkins glowing in the light!\n\n[Name] picks the biggest one to see,\n\"Orange is the color just for me!\"",
        "base_photo": "2-orange-the-pumpkin-patch.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the pumpkin stall photo with the child in the white background. Match the pose of the child at the pumpkin stall. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 3,
        "headline": "Yellow — The Popcorn Cart",
        "script_text": "Yellow, yellow, warm and sweet,\nPopcorn is a sunny treat!\n\n[Name] holds a box up to the sky,\n\"Yellow makes me want to try!\"",
        "base_photo": "3-yellow-the-popcorn-cart.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the popcorn cart photo with the child in the white background. Match the pose of the child at the popcorn cart. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 4,
        "headline": "Green — The Frog Game",
        "script_text": "Green, green, hop and jump,\nFrogs are bouncing — thump, thump, thump!\n\n[Name] tosses a ring and gives a shout,\n\"Green is what it''s all about!\"",
        "base_photo": "4-green-the-frog-game.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the frog game photo with the child in the white background. Match the pose of the child at the frog toss game. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 5,
        "headline": "Blue — The Prize Ribbon",
        "script_text": "Blue, blue, shiny and bright,\nA first-place ribbon — what a sight!\n\n[Name] holds it high above their head,\n\"I won a BLUE ribbon!\" [Name] said.",
        "base_photo": "5-blue-the-prize-ribbon.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the ribbon photo with the child in the white background. Match the pose of the child holding the blue ribbon. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 6,
        "headline": "Purple — The Magic Show",
        "script_text": "Purple, purple, full of mystery,\nA magician waves — what will it be?\n\n[Name] watches stars burst into the air,\n\"Purple magic is everywhere!\"",
        "base_photo": "6-purple-the-magic-show.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the magic show photo with the child in the white background. Match the pose of the child watching the magic show. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 7,
        "headline": "Pink — The Cotton Candy Cloud",
        "script_text": "Pink, pink, fluffy and sweet,\nCotton candy — what a treat!\n\n[Name] takes a bite of sugary air,\n\"Pink is floating everywhere!\"",
        "base_photo": "7-pink-the-cotton-candy-cloud.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the cotton candy photo with the child in the white background. Match the pose of the child holding the cotton candy. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 8,
        "headline": "White — The Snow Cone",
        "script_text": "White, white, cold as snow,\nA snow cone drips — watch it go!\n\n[Name] licks the ice, so cold and bright,\n\"Snow cones start with frosty white!\"",
        "base_photo": "8-white-the-snow-cone.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the snow cone photo with the child in the white background. Match the pose of the child holding the snow cone. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 9,
        "headline": "Brown — The Chocolate Fountain",
        "script_text": "Brown, brown, rich and deep,\nChocolate flowing — don''t let it sleep!\n\n[Name] dips a strawberry, watches it coat,\n\"Brown is the sweetest color to note!\"",
        "base_photo": "9-brown-the-chocolate-fountain.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the chocolate fountain photo with the child in the white background. Match the pose of the child at the chocolate fountain. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 10,
        "headline": "Rainbow — All the Colors!",
        "script_text": "Red, orange, yellow, green,\nBlue and purple — colors to dream!\n\nPink and white and brown so sweet —\nAt the carnival, the rainbow''s complete!\n\n[Name] spins around and looks up high,\nAll the colors paint the sky!",
        "base_photo": "10-rainbow-all-the-colors.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the rainbow carnival photo with the child in the white background. Match the pose of the child in the center of the rainbow carnival finale. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      }
    ]
  }'::jsonb
WHERE title = 'Colors of the Carnival';

-- ============================================================
-- 7. The Great Bake Sale (Math Learning)
-- ============================================================
UPDATE story_templates
SET
  scene_count = 10,
  script_data = '{
    "scenes": [
      {
        "scene_number": 1,
        "headline": "The Big Plan",
        "script_text": "[Name] has a very important plan.\n\nToday is Bake Sale day! [Name] is going to bake cookies, set up a stall, and sell them to raise money for the class pet — a goldfish named Bubbles.\n\nBut first, everything needs to be counted. [Name] stands at the kitchen table and looks at the ingredients laid out in a neat row: bags of flour, cups of sugar, eggs, and sticks of butter.",
        "base_photo": "1-the-big-plan.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the kitchen planning photo with the child in the white background. Match the pose of the child counting eggs at the kitchen table. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 2,
        "headline": "Measuring Up",
        "script_text": "Time to measure! The recipe says 2 cups of flour for each batch.\n\n[Name] scoops the flour carefully — one level cup, then a second — and tips them into the big mixing bowl.\n\n\"Two cups,\" [Name] says. \"That is the right amount. Not too much, not too little.\"\n\nNext: half a cup of sugar. [Name] looks at the measuring cup. The line marked 1/2 is right in the middle.",
        "base_photo": "2-measuring-up.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the measuring photo with the child in the white background. Match the pose of the child measuring flour into the mixing bowl. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 3,
        "headline": "Rows and Rows",
        "script_text": "The cookies are baked! Now comes the most satisfying part — arranging them on the baking tray.\n\n[Name] lifts each warm cookie with a spatula and places it carefully onto the cooling rack in neat rows.\n\n\"Three cookies in a row,\" [Name] counts. \"And how many rows? Four rows!\" [Name] steps back and looks at the whole rack.",
        "base_photo": "3-rows-and-rows.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the cooling rack photo with the child in the white background. Match the pose of the child arranging cookies on the cooling rack. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 4,
        "headline": "Decorating Patterns",
        "script_text": "Plain cookies are good. Decorated cookies are better.\n\n[Name] sets up the decorating station — two bowls of frosting, one pink and one white — and gets to work.\n\n\"I''m going to make a pattern,\" [Name] decides. \"Pink, white, pink, white — like a bracelet!\"\n\n[Name] frosts the first cookie pink. The second white. The third pink again. Fourth white. Across the whole rack.",
        "base_photo": "4-decorating-patterns.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the decorating photo with the child in the white background. Match the pose of the child decorating cookies with a pattern. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 5,
        "headline": "Open for Business!",
        "script_text": "[Name] sets up the bake sale stall outside — a folding table with a cheerful striped cloth, the cookies arranged in neat groups on plates, and a handwritten sign leaning against the front.\n\n\"Ten cookies on this plate,\" [Name] counts carefully. \"Ten on this one. And ten on this one.\"\n\n[Name] counts all the groups. \"Ten, twenty, thirty — thirty cookies ready to sell!\"\n\nBut there is one more very important thing: the price. [Name] thinks hard.",
        "base_photo": "5-open-for-business.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the bake sale stall photo with the child in the white background. Match the pose of the child standing behind the bake sale stall. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 6,
        "headline": "Cookies Selling Fast!",
        "script_text": "The bake sale is busy!\n\n[Name] watches as customers visit the stall. First sale: 2 cookies. Then 4 more. Then 2 again.\n\n\"I started with thirty cookies,\" [Name] says, checking the plates. \"I sold two, then four, then two more. That''s eight sold altogether. Thirty take away eight is...\"\n\n[Name] counts back from thirty: 29, 28, 27, 26, 25, 24, 23, 22.",
        "base_photo": "6-cookies-selling-fast.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the selling photo with the child in the white background. Match the pose of the child checking the cookie plates. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 7,
        "headline": "Making Change",
        "script_text": "A customer holds out a coin and points at four cookies.\n\n\"That is two coins for four cookies,\" [Name] says politely. \"But you only have one coin. One coin buys two cookies.\"\n\nThe customer nods and takes two cookies happily.\n\nThen another customer arrives with three coins. \"I want six cookies please!\"",
        "base_photo": "7-making-change.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the coin counting photo with the child in the white background. Match the pose of the child counting coins and cookies. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 8,
        "headline": "Which Plate Has More?",
        "script_text": "The bake sale is winding down. [Name] looks at the two remaining plates of cookies.\n\nOne plate has seven cookies. One plate has four.\n\n\"Which has more?\" [Name] asks — and then answers immediately. \"Seven is more than four. Seven is three more than four.\"\n\nBut then a new thought: \"If I take three cookies from the plate with seven and move them to the plate with four — how many will each plate have?\"",
        "base_photo": "8-which-plate-has-more.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the comparing plates photo with the child in the white background. Match the pose of the child comparing the two cookie plates. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 9,
        "headline": "Counting the Coins",
        "script_text": "The last cookie is sold!\n\n[Name] sits down at the table and tips all the coins out of the jar — they spread across the tablecloth with a satisfying clinking sound.\n\n\"Time to count,\" [Name] says seriously.\n\n[Name] sorts the coins into groups of five — it is easier to count that way. Five here, five there, five more, and then... four left over.",
        "base_photo": "9-counting-the-coins.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the coin counting photo with the child in the white background. Match the pose of the child counting the coins on the table. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      },
      {
        "scene_number": 10,
        "headline": "Sold Out!",
        "script_text": "The table is empty. The plates are bare. Every single cookie is gone.\n\n[Name] holds the coin jar — now full and heavy — and looks at the sign that says SOLD OUT, written in big letters across the original price card.\n\n\"Thirty cookies,\" [Name] says, thinking back through the whole day. \"Measured, mixed, baked, decorated, arranged, sold, and counted. And nineteen coins for Bubbles.\"",
        "base_photo": "10-sold-out.png",
        "child_photo": "front",
        "insertion_prompt": "replace the child in the sold out photo with the child in the white background. Match the pose of the child holding the full coin jar at the empty stall. make it look like it was taken with the child from the white background photo",
        "aspect_ratio": "9:16"
      }
    ]
  }'::jsonb
WHERE title = 'The Great Bake Sale';
