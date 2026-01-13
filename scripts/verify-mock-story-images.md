# Mock Story Images Verification Checklist

## Expected Images Location
**Bucket**: `story-template-assets`  
**Folder**: `mock_story/`

## 1. Day at the Zoo (10 scenes + cover)

### Required Images:
- ✅ `entrance.png` - Scene 1
- ✅ `monkeys.png` - Scene 2
- ✅ `giraffe.png` - Scene 3
- ✅ `aquarium.png` - Scene 4
- ✅ `lunch.png` - Scene 5
- ✅ `penguins.png` - Scene 6
- ⚠️ `goats.png` - Scene 7 (currently `goats.jpg` - should be `.png`)
- ✅ `butterflies.png` - Scene 8
- ✅ `gift-shop.png` - Scene 9
- ✅ `exit.png` - Scene 10
- ✅ `cover.png` - Cover image

**Status**: ⚠️ **1 issue found**: `goats.jpg` should be `goats.png` to match naming convention

---

## 2. Learning to Count (1 to 10) (10 scenes + cover)

### Required Images:
- ✅ `1-one.png` - Scene 1
- ✅ `2-two.png` - Scene 2
- ✅ `3-three.png` - Scene 3
- ✅ `4-four.png` - Scene 4
- ✅ `5-five.png` - Scene 5
- ✅ `6-six.png` - Scene 6
- ✅ `7-seven.png` - Scene 7
- ✅ `8-eight.png` - Scene 8
- ✅ `9-nine.png` - Scene 9
- ✅ `10-ten.png` - Scene 10
- ✅ `cover.png` - Cover image

**Status**: ✅ **All images present**

---

## 3. Alphabet Adventures A-I (9 scenes + cover)

### Required Images:
- ✅ `a-airplane.png` - Scene 1
- ✅ `b-bus.png` - Scene 2
- ✅ `c-cloud.png` - Scene 3
- ✅ `d-dog.png` - Scene 4
- ✅ `e-excavator.png` - Scene 5
- ✅ `f-fountain.png` - Scene 6
- ✅ `g-goose.png` - Scene 7
- ✅ `h-helicopter.png` - Scene 8
- ✅ `i-icecream.png` - Scene 9
- ✅ `cover.png` - Cover image

**Status**: ✅ **All images present**

---

## Summary

### Issues Found:
1. ⚠️ **File format mismatch**: `goats.jpg` should be renamed to `goats.png` for consistency

### Notes:
- All required images appear to be present
- The `goats.jpg` file should be converted to PNG or renamed if it's already PNG format
- Make sure all images are in the `mock_story/` folder (not in subfolders)
- Image paths in `mock_story_data` should be `/mock_story/{filename}`

