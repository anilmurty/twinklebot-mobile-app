# Lighthouse Audit Report - March 8, 2026

**Website:** www.twinklebot.app
**Run in:** Incognito mode, Chrome 145

## Overall Scores

| Category | Desktop | Mobile | Change from Previous |
|----------|---------|--------|---------------------|
| **Performance** | 99 | 94 | Desktop +7, Mobile +1 |
| **Accessibility** | 100 | 100 | Desktop +8, Mobile +14 |
| **Best Practices** | 96 | 96 | No change |
| **SEO** | 100 | 100 | No change |

## Key Performance Metrics

### Desktop
| Metric | Score | Value |
|--------|-------|-------|
| First Contentful Paint | 1.0 | 0.3 s |
| Largest Contentful Paint | 0.96 | 0.9 s |
| Speed Index | 1.0 | 0.4 s |
| Total Blocking Time | 1.0 | 0 ms |
| Cumulative Layout Shift | 1.0 | 0 |
| Time to Interactive | 1.0 | 0.9 s |

### Mobile
| Metric | Score | Value |
|--------|-------|-------|
| First Contentful Paint | 1.0 | 0.9 s |
| Largest Contentful Paint | 0.77 | 3.0 s |
| Speed Index | 1.0 | 1.4 s |
| Total Blocking Time | 1.0 | 50 ms |
| Cumulative Layout Shift | 1.0 | 0 |
| Time to Interactive | 0.94 | 3.2 s |

## Remaining Issues

### Best Practices (96 on both)

- **Console error**: HTTP 400 on `the-acquarium-helper.png` — broken image path in Supabase (space in filename)

### Performance — Desktop (99)

| Issue | Savings | Notes |
|-------|---------|-------|
| Image delivery | 2,536 KiB | Story covers from Supabase could be further optimized |
| Total byte weight | 4,056 KiB | Driven by number of carousel images |
| Render-blocking CSS | 70 ms | Next.js build output, limited control |
| Unused JavaScript | 30 KiB | Next.js bundle, limited control |
| Legacy JavaScript | 14 KiB | Transpilation overhead |

### Performance — Mobile (94)

| Issue | Savings | Notes |
|-------|---------|-------|
| Image delivery | 1,513 KiB | Story covers from Supabase |
| Main-thread work | 3.1 s | Script evaluation dominant (1.5s) |
| JS boot-up time | 1.5 s | Single large JS bundle |
| Total byte weight | 3,054 KiB | Driven by carousel images |
| Render-blocking CSS | 140 ms | Next.js build output |
| LCP | 3.0 s | Hero image on mobile (target: <2.5s) |
| Legacy JavaScript | 14 KiB | Transpilation overhead |

## What Was Fixed (This Session)

1. Hero images compressed from 17 MB to ~970 KB (PNG to JPEG)
2. Supabase image transforms enabled (width=640, quality=75)
3. Added `<main>` landmark (accessibility)
4. Added `aria-label` on mobile menu button (accessibility)
5. Fixed viewport `maximum-scale` from 1 to 5 (accessibility, WCAG)
6. Added robots.txt, sitemap.xml, JSON-LD structured data
7. Created proper 1200x630 OG image for social sharing
8. Added security headers
9. Created custom 404 page

## Remaining Action Items

1. Fix aquarium helper image path (space encoding issue in Supabase)
2. Mobile LCP (3.0s) could improve with smaller hero images or preloading
3. Render-blocking CSS and unused JS are Next.js internals — minimal control
4. Consider lazy-loading off-screen carousel images
