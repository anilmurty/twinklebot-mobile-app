# Prompt Review - Character Variations and Scene Insertion

## Character Variation Prompts

These prompts are used to generate three different views of the character (front, left, right).

### Front Variation Prompt
**Input**: Uploaded character photo  
**Prompt**:
```
dress this child like they're ready for a day at the zoo. safari attire, bright animal-themed sun hat, binoculars dangling, arms on either side and happy expression. keep facial features identical. white background and full length
```

### Left Variation Prompt
**Input**: Front variation (generated above)  
**Prompt**:
```
Change this so that the child is facing right
```

### Right Variation Prompt
**Input**: Front variation (generated above)  
**Prompt**:
```
Change this so that the child is facing left
```

**Note**: The front variation is generated first using the uploaded photo. Then left and right variations are generated using the front variation as input.

---

## Scene Insertion Prompts

These prompts are used to insert the character into each base photo scene. The character variation (front/left/right) is specified per scene.

### Scene 1: The Grand Entrance
- **Base Photo**: `entrance.jpeg`
- **Character Variation**: `front`
- **Insertion Prompt**:
```
add the child to the zoo photo, clutching an open paper map with an expression of amazement and curiosity for what's ahead. make height proportionate to surroundings. keep everything else the same and make it look natural
```

### Scene 2: Monkey Business
- **Base Photo**: `monkeys.jpeg`
- **Character Variation**: `right`
- **Insertion Prompt**:
```
put the child in the photo, excited, hands in the air. keep everything else the same and make it look natural
```

### Scene 3: Feeding A Giraffe
- **Base Photo**: `giraffe.jpeg`
- **Character Variation**: `left`
- **Insertion Prompt**:
```
put the child in the image, securely behind the raised fence, feeding the giraffe lettuce, expression of excitement and amazement. keep everything else the same and make it natural
```

### Scene 4: The Underwater Tunnel
- **Base Photo**: `aquarium.jpeg`
- **Character Variation**: `left`
- **Insertion Prompt**:
```
Add the child into the photo. they should be standing under the giant turtle, firmly on the ground, hands on the glass and face and neck bent upward to admire the turtle. keep everything else the same and make it natural
```

### Scene 5: Lunch at the Plaza
- **Base Photo**: `lunch.jpeg`
- **Character Variation**: `right`
- **Insertion Prompt**:
```
put the child in the photo, sitting and sipping a juice box as if they're posing for a photo. keep everything else the same and make it look natural
```

### Scene 6: Penguin Parade
- **Base Photo**: `penguins.jpeg`
- **Character Variation**: `right`
- **Insertion Prompt**:
```
put the child in the photo, facing the glass and hands on it and nose pressing against it. keep everything else the same and make it look natural
```

### Scene 7: The Petting Zoo
- **Base Photo**: `goats.jpeg`
- **Character Variation**: `left`
- **Insertion Prompt**:
```
put the child in the photo, on their knees and gently petting the goat with their right hand while feeding the goat grains with their left hand. expression of quiet observation. keep everything else the same and make it look natural
```

### Scene 8: The Butterfly Garden
- **Base Photo**: `butterflies.jpeg`
- **Character Variation**: `front`
- **Insertion Prompt**:
```
put the child in the photo, standing on the higher ground with their arm extended and their eyes gazing at he blue butterfly and their face turned towards it. The child's facial expression that is hoping that the blue butterfly sits on it. keep everything else the same and make it natural
```

### Scene 9: The Gift Shop
- **Base Photo**: `gift-shop.jpeg`
- **Character Variation**: `left`
- **Insertion Prompt**:
```
put the child in the photo, standing to the right of the penguin stand and examining the big penguin by pressing it with their hands
```

### Scene 10: What a day
- **Base Photo**: `entrance.jpeg`
- **Character Variation**: `front`
- **Insertion Prompt**:
```
put the child in the photo, they should be walking out after a long day, tired but smiling and with an icecream in the child's hand
```

---

## How These Prompts Are Used

1. **Character Variations**: 
   - Generated once per character-template combination
   - Uses the uploaded character photo as input
   - Creates 3 variations (front, left, right)
   - Stored in `character-variations` bucket

2. **Scene Generation**:
   - For each scene:
     - Base photo URL (from Supabase Storage: `story-template-assets/day-at-the-zoo/`)
     - Appropriate character variation URL (front/left/right per scene)
     - Insertion prompt (from above)
   - All sent to Replicate API together
   - Generated scene stored in `storybook-scenes` bucket

## Notes

- Character variation prompts focus on maintaining exact facial features, hair, skin tone, and expression
- Scene insertion prompts focus on positioning, pose, expression, and interaction with scene elements
- All prompts include instructions to "keep everything else the same" to preserve the base photo

