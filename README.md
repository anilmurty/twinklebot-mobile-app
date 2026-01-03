# Twinklebot Mobile App

AI-powered personalized storybook generator for kids. Parents upload photos of their child, choose a story template, and generate custom storybooks featuring their child as the hero.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Radix UI, Tailwind CSS v4
- **Backend**: Next.js API Routes, Supabase (PostgreSQL, Auth, Storage)
- **AI**: Replicate API (Google Nano Banana for image generation)
- **Deployment**: Vercel (with Cron Jobs for background processing)

## Project Structure

\`\`\`
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── v1/           # REST API endpoints
│   │   └── cron/         # Background job handlers
│   └── page.tsx          # Main app page
├── components/            # React components
│   ├── ui/               # UI primitives (Radix UI)
│   └── *.tsx            # Feature components
├── lib/                  # Utilities and services
│   ├── supabase/        # Supabase client helpers
│   └── services/        # Business logic (image generation, etc.)
├── db_scripts/          # Database migrations
├── public/              # Static assets
└── tech-spec.md         # Technical specification

\`\`\`

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- Supabase account
- Replicate API account

### Setup

1. **Clone and install**:
   \`\`\`bash
   pnpm install
   \`\`\`

2. **Environment variables** (`.env.local`):
   \`\`\`env
   # Supabase (NEXT_PUBLIC_ prefix required for client-side access)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Replicate (server-side only, no prefix needed)
   REPLICATE_API_TOKEN=your_replicate_token
   NANOBANANA_MODEL_VERSION=google/nano-banana

   # Vercel Cron (production)
   CRON_SECRET=your_random_secret
   \`\`\`

3. **Database setup**:
   \`\`\`bash
   # Run migrations in order:
   # 1. db_scripts/001_initial_schema.sql
   # 2. db_scripts/002_seed_nano_banana_model.sql
   # 3. db_scripts/003_seed_story_templates.sql
   # 4. db_scripts/004_update_template_storage_urls.sql
   # 5. db_scripts/005_create_profile_on_auth_trigger.sql
   \`\`\`

4. **Storage setup**:
   - Create Supabase Storage buckets:
     - `character-photos` (private)
     - `storybook-scenes` (private)
     - `story-template-assets` (public)
   - Upload template cover images and thumbnails
   - Update URLs in database (see `db_scripts/004_update_template_storage_urls.sql`)

5. **Run development server**:
   \`\`\`bash
   pnpm dev
   \`\`\`

## API Endpoints

### Authentication
- Uses Supabase Auth (JWT tokens)
- Get token: Use `public/get-token.html` helper page

### Characters
- `GET /api/v1/characters` - List user's characters
- `POST /api/v1/characters` - Create character (with photo uploads)
- `GET /api/v1/characters/:id` - Get character details
- `PUT /api/v1/characters/:id` - Update character
- `DELETE /api/v1/characters/:id` - Delete character

### Story Templates
- `GET /api/v1/story-templates` - List all templates
- `GET /api/v1/story-templates/:id` - Get template details

### Storybooks
- `GET /api/v1/storybooks` - List user's storybooks
- `POST /api/v1/storybooks` - Create storybook (auto-starts generation in dev)
- `GET /api/v1/storybooks/:id` - Get storybook with scenes
- `GET /api/v1/storybooks/:id/status` - Get generation status
- `POST /api/v1/storybooks/:id/generate` - Manually trigger generation
- `DELETE /api/v1/storybooks/:id` - Delete storybook

### Profile
- `GET /api/v1/profile` - Get user profile
- `PUT /api/v1/profile` - Update profile

## Testing

### Browser Testing
1. Open `http://localhost:3000/get-token.html`
2. Sign in to get your JWT token
3. Open `http://localhost:3000/test-api.html`
4. Paste token and test endpoints

### Manual API Testing
\`\`\`bash
# Get token first
curl -X POST https://your-project.supabase.co/auth/v1/token?grant_type=password \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"email":"test@example.com","password":"password"}'

# Use token in requests
curl http://localhost:3000/api/v1/story-templates \
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`

## Storybook Generation Flow

1. **Create Storybook**: User selects template and character
2. **Queue Job**: Storybook created with `status: 'pending'`
3. **Background Processing**:
   - Development: Auto-starts immediately
   - Production: Vercel Cron picks up every minute
4. **Scene Generation**:
   - For each scene:
     - Build prompt (fixed parts + scene-specific action/detail)
     - Call Replicate API with character photos
     - Download generated image
     - Upload to Supabase Storage
     - Update progress (0-100%)
   - Retries: 3 attempts per scene with exponential backoff
5. **Completion**: Status set to `completed`, all scenes stored

## Database Schema

See `db-schema.md` for complete schema documentation.

Key tables:
- `profiles` - User profiles
- `characters` - Child characters (with photo URLs)
- `story_templates` - Pre-defined story templates
- `storybooks` - Generated storybooks (with scenes array)
- `generation_models` - AI model configurations
- `generation_jobs` - Background job tracking

## Deployment

### Vercel

1. Connect GitHub repository
2. Set environment variables
3. Deploy (Cron jobs configured in `vercel.json`)

### Environment Variables (Production)

- All variables from `.env.local`
- Ensure `CRON_SECRET` is set for cron job security

## Troubleshooting

### Storybook Generation Fails

1. **Check Replicate API**:
   - Verify `REPLICATE_API_TOKEN` is set
   - Check model version is valid
   - Review Replicate API logs

2. **Check Character Photos**:
   - Photos must be accessible URLs
   - Private bucket photos use signed URLs (auto-generated)

3. **Check Database**:
   \`\`\`sql
   SELECT status, error_message FROM storybooks WHERE id = '...';
   SELECT * FROM generation_jobs WHERE storybook_id = '...';
   \`\`\`

### Authentication Issues

- Verify Supabase credentials
- Check JWT token expiration
- Ensure RLS policies are set correctly

### Storage Issues

- Verify bucket permissions
- Check file paths match database URLs
- Ensure service role key has storage access

## Documentation

- `tech-spec.md` - Complete technical specification
- `db-schema.md` - Database schema documentation
- `db_scripts/README.md` - Migration guide

## License

[Your License Here]
