import { NextRequest } from 'next/server'
import { createServerClient } from './server'

export async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader) {
    return null
  }

  const supabase = createServerClient(authHeader)
  // Verify JWT token and get user
  const { data, error } = await supabase.auth.getUser()
  
  if (error || !data.user) {
    return null
  }
  
  return { data, error: null }
}

export async function requireAuth(request: NextRequest) {
  const user = await getAuthUser(request)
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  return user
}

