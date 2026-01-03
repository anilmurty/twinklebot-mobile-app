# Twinklebot Mobile App - Technical Specification

## Overview

Twinklebot is a mobile application (iOS and Android) that generates personalized AI storybooks for children where the child is the hero. The app uses state-of-the-art AI image and text generation tools to create custom storybooks based on uploaded photos and pre-defined story templates.

## Architecture

### Platform
- **Mobile**: React Native/Expo (recommended) or Native (Swift/Kotlin)
- **Backend**: Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Authentication**: Supabase Auth (Google Sign-In, Facebook later)
- **Image Generation**: Replicate API (Google nano-banana model)
- **Text Generation**: Google Gemini API (for future enhancements)

### Technology Stack

#### Frontend
- React Native/Expo (or Native iOS/Android)
- Supabase Client SDK
- React Navigation
- Camera/Image Picker libraries

#### Backend
- Vercel Serverless Functions (Node.js/TypeScript)
- Supabase Client (Server-side)
- Replicate API Client
- Google Gemini API Client

#### Infrastructure
- Vercel (API Routes + Cron Jobs)
- Supabase (Database + Auth + Storage)
- Replicate (Image Generation)
- Firebase/APNs (Push Notifications)

## User Flow

### 1. Authentication
- User signs in with Google (Facebook later)
- Supabase Auth handles OAuth flow
- User profile created in `profiles` table

### 2. Character Creation
- User clicks "Create Character"
- Uploads/takes 3 photos: front, left, right
- Photos uploaded to Supabase Storage
- Character record created in `characters` table
- Character name must be unique per user (max 20 alphanumeric chars)

### 3. Storybook Generation
- User navigates to Story Library or clicks "+ New Storybook" from Characters tab
- Selects a story template
- Selects a character
- Clicks "Generate"
- Storybook record created with status="pending"
- Background job queued for generation
- User can navigate away or close app
- Push notification sent when complete

### 4. Storybook Viewing
- User views generated storybooks in Storybooks tab
- Each storybook shows scenes with images and text overlays
- User can read through scenes sequentially

## Database Schema

See `db-schema.md` for complete database schema documentation.

### Key Tables
- `profiles`: User profiles (linked to Supabase Auth)
- `characters`: Child characters with photo URLs
- `generation_models`: Image generation model configurations
- `story_templates`: Pre-defined story templates with scripts
- `storybooks`: Generated storybooks with scenes
- `generation_jobs`: Background job tracking

## API Design

### Authentication Endpoints
Handled by Supabase Auth:
- `POST /auth/v1/signin/google`
- `POST /auth/v1/signout`
- `GET /auth/v1/user`

### Characters API
\`\`\`
GET    /api/v1/characters
POST   /api/v1/characters
GET    /api/v1/characters/:id
PATCH  /api/v1/characters/:id
DELETE /api/v1/characters/:id
\`\`\`

### Generation Models API
\`\`\`
GET /api/v1/generation-models
GET /api/v1/generation-models/:id
\`\`\`

### Story Templates API
\`\`\`
GET /api/v1/story-templates
GET /api/v1/story-templates/:id
\`\`\`

### Storybooks API
\`\`\`
GET    /api/v1/storybooks
POST   /api/v1/storybooks
GET    /api/v1/storybooks/:id
DELETE /api/v1/storybooks/:id
GET    /api/v1/storybooks/:id/status
\`\`\`

### Profile API
\`\`\`
GET  /api/v1/profile
PATCH /api/v1/profile
POST /api/v1/profile/subscription/upgrade
POST /api/v1/profile/subscription/downgrade
\`\`\`

## Story Templates

### Pre-Generated Content
Story templates are static and stored in the database with:
- Cover images (pre-generated)
- Thumbnail images
- Script data for each scene:
  - `script_text`: Text to overlay on image
  - `prompt`: Structured prompt for image generation:
    - `subject`: Character description with placeholders
    - `action`: Character action with placeholders
    - `scene_details`: Scene description
    - `style`: Visual style instructions
  - `aspect_ratio`: Image aspect ratio (default: "9:16")
  - `number` or `letter`: For counting/alphabet adventures

### Available Templates

1. **Counting Adventure** (10 scenes)
   - Teaches numbers 1-10
   - Each scene emphasizes one number
   - Example: "Adam counted FOUR big red apples..."

2. **Alphabet Adventure 1** (9 scenes)
   - Letters A through I
   - Example: "B is for Baker! Bryan the baker..."

3. **Alphabet Adventure 2** (9 scenes)
   - Letters J through R

4. **Alphabet Adventure 3** (8 scenes)
   - Letters S through Z

## Image Generation Flow

### Flexible Model System

The system is designed to support multiple image generation models (nano-banana, Flux, DALL-E, etc.) with different prompting requirements. Each model configuration is stored in the `generation_models` table.

**Model Configuration Structure:**
- `name`: Model identifier (e.g., 'nano-banana', 'flux')
- `provider`: API provider (e.g., 'replicate', 'openai')
- `model_identifier`: Provider-specific model ID/version
- `prompt_structure`: Defines how to construct prompts for this model
- `api_config`: API-specific settings (endpoints, auth, polling, etc.)

### Prompt Structure (Nano-Banana Example)

For nano-banana, prompts are composed of 4 parts:
- **Subject** (Fixed): Character description, same for all scenes
- **Style** (Fixed): Visual style instructions, same for all scenes
- **Action** (Variable): Character action, changes per scene
- **Detail** (Variable): Scene-specific details, changes per scene

**Template Structure:**
- `fixed_prompt_parts`: Contains Subject and Style (stored once per template)
- `script_data.scenes[]`: Contains Action and Detail per scene

**Prompt Construction:**
1. Load template's `fixed_prompt_parts` (subject, style)
2. Load scene-specific parts (action, detail)
3. Replace `{character_name}` placeholder with actual character name
4. Combine according to model's `prompt_structure` configuration
5. Pass to model's API according to `api_config`

### Using Replicate Nano-Banana

1. **Character Photos**: 3 photos (front, left, right) stored in Supabase Storage
2. **Prompt Construction**: 
   - Load template's `fixed_prompt_parts` (subject, style)
   - Load scene's action and detail from `script_data`
   - Replace `{character_name}` placeholder
   - Combine: Subject + Action + Detail + Style (with `\n\n` separators)
3. **API Call**:
   - Model: `google/nano-banana` (via Replicate)
   - Input: Combined prompt + 3 character photo URLs
   - Aspect ratio: From template (default: "9:16")
   - Output format: JPG
4. **Polling**: Poll Replicate API until generation completes (5s intervals, max 60 attempts)
5. **Storage**: Upload generated image to Supabase Storage
6. **Caching**: Store scene data in `storybooks.scenes` JSONB field

### Switching Models

To switch to a different model (e.g., Flux):
1. Add new model configuration to `generation_models` table
2. Update `prompt_structure` for Flux's requirements
3. Update `api_config` with Flux's API settings
4. Update templates to reference new `generation_model_id` (or create new templates)
5. No code changes needed - system reads model config from database

### Retry Logic
- 3 attempts per scene
- Exponential backoff between retries (2s, 4s, 8s)
- If all 3 attempts fail, mark storybook as failed
- Failed storybooks can be regenerated (will skip already-generated scenes)

## Background Processing

### Generation Job Flow

1. User creates storybook → API creates record with status="pending"
2. Vercel Cron Job (or separate worker) polls for pending storybooks
3. For each scene:
   - Check if already generated (skip if exists)
   - Call Replicate API with character photos + prompt
   - Poll for completion
   - Upload to Supabase Storage
   - Update storybook.scenes array
   - Update progress percentage
4. When all scenes complete:
   - Mark storybook as "completed"
   - Send push notification

### Job Processing Options

**Option A: Vercel Cron Jobs**
- Cron job runs every minute
- Checks `storybooks` table for status="pending" or "generating"
- Processes one storybook at a time
- Simple but limited by Vercel function timeout (10s for Hobby, 60s for Pro)

**Option B: Separate Worker Service**
- Dedicated service (Railway, Render, etc.)
- Polls Supabase for pending jobs
- Can handle longer-running processes
- More control over concurrency

**Recommended**: Start with Option A, migrate to Option B if needed.

## Push Notifications

### Implementation Options

1. **Supabase Realtime**
   - Listen for storybook status changes
   - Works when app is open
   - Limited background support

2. **Firebase Cloud Messaging (FCM)**
   - Native push notifications
   - Works when app is closed
   - Requires Firebase setup

3. **APNs (iOS) / FCM (Android)**
   - Platform-specific implementations
   - Best reliability

**Recommended**: Use Supabase Realtime for in-app updates, FCM for background notifications.

## Storage Structure

### Supabase Storage Buckets

\`\`\`
character-photos/
  └── {user_id}/
      └── {character_id}/
          ├── front.jpg
          ├── left.jpg
          └── right.jpg

storybook-scenes/
  └── {storybook_id}/
      ├── scene-1.jpg
      ├── scene-2.jpg
      └── ...
\`\`\`

### Storage Policies
- Character photos: Private, user-scoped
- Storybook scenes: Private, user-scoped
- Story template covers: Public read

## Security & Access Control

### Row Level Security (RLS) Policies

1. **Profiles**: Users can only read/update their own profile
2. **Characters**: Users can only access their own characters
3. **Storybooks**: Users can only access their own storybooks
4. **Story Templates**: Public read access
5. **Storage**: User-scoped access based on user_id

### API Authentication
- All API endpoints require Supabase JWT token
- Token validated on each request
- User ID extracted from token for RLS

## Cost Optimization

### Image Generation Caching
- Generated scenes stored in `storybooks.scenes` JSONB
- Check existing scenes before generating
- Avoid regenerating completed storybooks
- Retry failed scenes without regenerating successful ones

### Rate Limiting
- Track `stories_generated_this_month` in profiles table
- Enforce subscription limits (Free: 3/month)
- Return error if limit exceeded

## Error Handling

### Scene Generation Failures
- 3 retry attempts per scene
- Exponential backoff: 2s, 4s, 8s
- Log errors to `generation_jobs.error_message`
- Mark storybook as failed if all retries exhausted

### API Failures
- Retry transient errors (network, rate limits)
- Return user-friendly error messages
- Log detailed errors server-side

## Monitoring & Logging

### Key Metrics
- Storybook generation success rate
- Average generation time per scene
- API error rates (Replicate, Supabase)
- User engagement (characters created, storybooks generated)

### Logging
- Log all API calls to Replicate
- Log generation job start/completion
- Log errors with context (storybook_id, scene_number, error)

## Future Enhancements

1. **Custom Story Creation**: User-created story templates
2. **Story Sharing**: Share storybooks with family/friends
3. **Offline Reading**: Download storybooks for offline access
4. **Multiple Characters**: Stories with multiple child characters
5. **Voice Narration**: Text-to-speech for storybooks
6. **Print Options**: Order physical storybooks
7. **Desktop Web App**: Expand to web platform

## Environment Variables

\`\`\`bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Replicate
REPLICATE_API_TOKEN=your_replicate_token
NANOBANANA_MODEL_VERSION=latest_version_id

# Google Gemini (for future use)
GOOGLE_AI_STUDIO_API_KEY=your_gemini_api_key

# Push Notifications (if using FCM)
FCM_SERVER_KEY=your_fcm_server_key

# Vercel
VERCEL_URL=your_vercel_url
\`\`\`

## Deployment

### Backend
- Deploy API routes to Vercel
- Set up Vercel Cron Jobs for background processing
- Configure environment variables in Vercel dashboard

### Database
- Run migration scripts in Supabase SQL Editor
- Set up RLS policies
- Configure storage buckets and policies

### Mobile App
- Build iOS app with Xcode
- Build Android app with Android Studio
- Or use Expo for cross-platform builds

## Testing Strategy

### Unit Tests
- API endpoint handlers
- Database helper functions
- Prompt construction logic

### Integration Tests
- Character creation flow
- Storybook generation flow
- Replicate API integration

### E2E Tests
- Complete user journey
- Background generation
- Push notifications

## Performance Considerations

### Image Generation
- Average time per scene: ~10-15 seconds
- Total time for 10-scene storybook: ~2-3 minutes
- Process scenes sequentially to avoid rate limits

### Database Queries
- Index frequently queried columns
- Use JSONB efficiently for scenes array
- Cache story templates (rarely change)

### Mobile App
- Lazy load storybook scenes
- Cache character photos locally
- Optimize image loading and display
