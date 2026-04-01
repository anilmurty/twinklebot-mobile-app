import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/supabase/auth'

function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS || process.env.ADMIN_ALERT_EMAIL || ''
  return raw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
}

export function isAdminEmail(email: string): boolean {
  return getAdminEmails().includes(email.toLowerCase())
}

/**
 * Validate that the request is from an authenticated admin user.
 * Returns the user ID and email, or null if not admin.
 */
export async function requireAdmin(request: NextRequest): Promise<{ userId: string; email: string } | null> {
  const user = await getAuthUser(request)
  if (!user?.data.user) return null

  const email = user.data.user.email || ''
  if (!isAdminEmail(email)) return null

  return { userId: user.data.user.id, email }
}
