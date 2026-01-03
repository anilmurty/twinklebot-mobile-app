/**
 * Centralized design mode detection
 * 
 * Design mode is enabled when:
 * 1. DESIGN_MODE=1 is explicitly set, OR
 * 2. NEXT_PUBLIC_DESIGN_MODE=1 is set (client-side), OR
 * 3. Accessed via v0.dev hostname, OR
 * 4. Supabase env vars are missing (auto-fallback for v0 previews)
 */

export function isDesignMode(): boolean {
  // Explicit flag (server-side)
  if (process.env.DESIGN_MODE === "1") return true;

  // Explicit flag (client-side)
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DESIGN_MODE === '1') {
    return true;
  }

  // Auto-detect v0.dev hostname (client-side)
  if (typeof window !== 'undefined' && window.location.hostname.includes('v0.dev')) {
    return true;
  }

  // Auto-fallback: if Supabase env vars are missing, enable design mode
  // This prevents v0 from prompting for env vars and crashing
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return true;
  }

  return false;
}
