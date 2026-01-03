/**
 * API client helper functions
 */

const API_BASE = '/api/v1'

async function getAuthToken(): Promise<string | null> {
  // Get token from Supabase client
  const { createClient } = await import('@/lib/supabase/client-browser')
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken()
  
  if (!token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error || `API error: ${response.status}`)
  }

  // Handle 204 No Content and other empty responses
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null as T
  }

  // Check if response has content before parsing JSON
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  }

  // Return null for non-JSON responses
  return null as T
}

// Characters API
export const charactersApi = {
  list: () => apiRequest<{ characters: any[] }>('/characters'),
  get: (id: string) => apiRequest<any>(`/characters/${id}`),
  create: (data: { name: string; gender: "male" | "female"; photo_path: string }) => {
    return apiRequest<any>('/characters', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  update: (id: string, data: FormData) => {
    return getAuthToken().then(async (token) => {
      const response = await fetch(`${API_BASE}/characters/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: data,
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(error.error || `API error: ${response.status}`)
      }
      return response.json()
    })
  },
  delete: (id: string) => apiRequest<void>(`/characters/${id}`, { method: 'DELETE' }),
}

// Storybooks API
export const storybooksApi = {
  list: (status?: string) => {
    const query = status ? `?status=${status}` : ''
    return apiRequest<{ storybooks: any[]; total: number }>(`/storybooks${query}`)
  },
  get: (id: string) => apiRequest<any>(`/storybooks/${id}`),
  create: (characterId: string, templateId: number) =>
    apiRequest<any>('/storybooks', {
      method: 'POST',
      body: JSON.stringify({ character_id: characterId, template_id: templateId }),
    }),
  getStatus: (id: string) => apiRequest<any>(`/storybooks/${id}/status`),
  triggerGeneration: (id: string) =>
    apiRequest<any>(`/storybooks/${id}/generate`, { method: 'POST' }),
  delete: (id: string) => apiRequest<void>(`/storybooks/${id}`, { method: 'DELETE' }),
}

// Story Templates API
export const templatesApi = {
  list: () => apiRequest<{ templates: any[] }>('/story-templates'),
  get: (id: number) => apiRequest<any>(`/story-templates/${id}`),
}

// Profile API
export const profileApi = {
  get: () => apiRequest<any>('/profile'),
  update: (data: { full_name?: string; avatar_url?: string }) =>
    apiRequest<any>('/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
}
