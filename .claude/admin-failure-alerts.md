# Admin Failure Alerts

**Date:** 2026-04-05

## Overview

When storybook or preview generation fails, an email alert is automatically sent to the admin so failures can be investigated quickly.

## Configuration

Requires two env vars (already set for QC emails):
- `RESEND_API_KEY` — Resend API key
- `ADMIN_ALERT_EMAIL` — recipient email address

If not configured, alerts are silently skipped (logged to console).

## Email Details

| Field | Value |
|-------|-------|
| **From** | `TwinkleBot Alerts <alerts@twinklebot.app>` |
| **To** | `ADMIN_ALERT_EMAIL` env var |
| **Subject** | `[FAILED] Story: {title} starring {characterName}` or `[FAILED] Preview: {title} starring {characterName}` |

## Email Contents

- **Phase** — preview or full-generation
- **Character name, style, storybook ID**
- **Scenes completed vs total** (full generation only)
- **Duration** before failure
- **Error message** (full, not truncated)
- **Stack trace**
- **"View Vercel Logs" button** — links to `vercel.com/.../logs?search={storybookId}`, pre-filtered to that storybook's logs
- **Timestamp**

## Where Alerts Are Triggered

| File | Phase | When |
|------|-------|------|
| `lib/services/storybook-generator.ts` | `full-generation` | Unexpected error in `generateStorybook()` catch block, after credit refund |
| `lib/services/preview-generator.ts` | `preview` | Any error in `generatePreview()` catch block |

Both calls are wrapped in try/catch — a failure to send the alert never interferes with the actual error handling (status update, credit refund, etc.).

## Related Email Alerts

| Subject Pattern | Source | Purpose |
|----------------|--------|---------|
| `[QC] {title} starring {name} ({style})` | `storybook-generator.ts` | Sent after **successful** generation for quality check |
| `[ALERT] Stuck storybook: {title}` | `recover-stuck-storybooks` cron | Sent when a storybook is stuck in `generating` for >5 minutes |
| `[FAILED] ...` | Both generators | Sent on generation failure (this feature) |

## Key Files

- `lib/services/admin-alerts.ts` — `sendStoryFailureAlert()` and `sendStoryCompletionAlert()`
- `lib/services/storybook-generator.ts` — full generation, calls alert in outer catch
- `lib/services/preview-generator.ts` — preview generation, calls alert in catch
- `app/api/cron/recover-stuck-storybooks/route.ts` — stuck storybook recovery + alert
