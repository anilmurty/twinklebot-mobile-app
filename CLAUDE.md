# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run lint         # ESLint
npm run cap:sync     # Sync web build to Capacitor native projects
npm run cap:open:ios # Open in Xcode
```

No test framework is configured — there are no test commands.

## Architecture

**What it is:** AI-powered personalized storybook generator for kids. Parents upload photos of their child, choose a story template, and the app generates custom illustrated storybooks featuring their child as the hero.

### Tech Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Supabase** — auth (Google OAuth), PostgreSQL, private storage buckets
- **TanStack React Query** — client data fetching, cached to IndexedDB
- **Tailwind CSS v4** + Radix UI components
- **Capacitor** — native iOS/Android shell (loads live web app from `https://www.twinklebot.app/app`)
- **Stripe** (web payments) + **RevenueCat** (native IAP)
- **Replicate** or **fal.ai** for AI image generation (controlled by `IMAGE_PROVIDER` env var)
- **Vercel** hosting with a cron job every minute for background generation

### Key Directories

| Path | Purpose |
|------|---------|
| `app/` | Next.js App Router pages and API routes |
| `app/api/v1/` | REST API (characters, storybooks, templates, profile, payments) |
| `app/api/cron/` | Vercel Cron handler — picks up pending storybooks and generates them |
| `app/share/[token]/` | Public shared storybook viewer |
| `app/storybook/[id]/` | Authenticated storybook viewer |
| `components/` | UI components; `components/ui/` holds Radix primitives |
| `lib/services/` | Core business logic (image generation, storybook orchestration, IAP) |
| `lib/queries/` | React Query hooks (`useStorybooks`, `useCharacters`, `useTemplates`, `useProfile`) |
| `lib/supabase/` | Supabase client initializers (server, browser, auth, storage) |
| `db_scripts/` | Numbered SQL migration files (`001_*.sql` → `059_*.sql`) applied manually in Supabase |

### Storybook Generation Flow

1. User selects template + character → `POST /api/v1/storybooks` creates record with `status: 'pending'`
2. Vercel Cron (`/api/cron/generate-storybooks`, runs every minute) picks it up
3. `lib/services/storybook-generator.ts` generates scenes sequentially:
   - Combines template scene prompts with character photos
   - Calls image generation API (Replicate or fal.ai)
   - Uploads result to Supabase Storage (`storybook-scenes` bucket, private)
   - Updates progress field (0–200 range, where 0–100 = character variation phase, 100–200 = scenes phase)
4. Status set to `completed`

### Image Generation

Two providers in `lib/services/image-generation.ts`, selected by `IMAGE_PROVIDER` env var:
- **`replicate`** (default) — uses `lib/services/replicate-helper.ts`
- **`fal`** — uses `lib/services/fal-client.ts`; uses `status_url`/`response_url` from the queue submission response (do NOT construct these URLs manually — that causes 405 errors)

Model: `google/nano-banana-2` (configured in `generation_models` DB table)

### Storage & Image Access

Supabase buckets:
- `character-photos` — private; accessed via signed URLs
- `storybook-scenes` — private; accessed via signed URLs
- `story-template-assets` — public

`/api/og-image/[token]` is a public proxy endpoint that fetches a scene image from private storage and returns the bytes — used for OG/social preview images (crawlers can't follow signed URLs).

### Authentication

- Supabase Auth with Google OAuth
- `middleware.ts` refreshes JWT tokens on every request
- `DESIGN_MODE=true` / `NEXT_PUBLIC_DESIGN_MODE=true` skips Supabase auth for v0.dev previews

### Payments

- **Web**: Stripe checkout — `POST /api/v1/payments/create-checkout`
- **Native**: RevenueCat IAP — `lib/services/iap-service.ts`
- Story credits purchased in bundles; plans stored in `generation_models`/`plans` tables

### Database Migrations

Migrations live in `db_scripts/` as numbered SQL files. They are applied manually via the Supabase SQL editor — there is no ORM or automated migration runner. Name new files `NNN_description.sql` incrementing from the last number.

### Progress Field Convention

The `storybooks.progress` column uses a 0–200 scale:
- 0–100: character variation generation phase
- 100–200: scene generation phase

When displaying as a percentage in the UI, clamp with `Math.min(scenesDone / totalScenes * 100, 100)`.

### Mobile / Capacitor

The Capacitor native shell loads the live web app — there is no local native build needed for web development. Run `npm run cap:sync` + `npm run cap:open:ios` only when updating native plugins or config. Platform detection is in `lib/utils/` (`isNative()`, etc.).
