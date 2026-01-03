/**
 * API client helper functions
 */

const API_BASE = '/api/v1'

// ✅ DESIGN_MODE: Check if we're in design mode
function isDesignMode(): boolean {
  return typeof window !== 'undefined' && 
    (window.location.hostname.includes('v0.dev') || 
     process.env.NEXT_PUBLIC_DESIGN_MODE === '1')
}

async function getAuthToken(): Promise<string | null> {
  // ✅ DESIGN_MODE: Return null token in design mode
  if (isDesignMode()) {
    return null
  }
  
  // Get token from Supabase client
  const { createClient } = await import('@/lib/supabase/client-browser')
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

// ✅ DESIGN_MODE: Mock data for design mode
function getMockData<T>(endpoint: string, method: string = 'GET'): T | null {
  if (!isDesignMode()) {
    return null
  }

  // Mock storybooks data
  if (endpoint.startsWith('/storybooks')) {
    if (method === 'GET') {
      if (endpoint === '/storybooks' || endpoint.startsWith('/storybooks?')) {
        const now = new Date()
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
        
        return {
          storybooks: [
            {
              id: 'mock-storybook-1',
              title: 'A Day at the Zoo',
              character_name: 'Emma',
              status: 'completed',
              progress: 100,
              created_at: twoDaysAgo.toISOString(),
              completed_at: yesterday.toISOString(),
              thumbnail_url: 'https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=Zoo+Adventure',
              total_scenes: 10,
              character: { id: 'mock-character-1', name: 'Emma' },
              template: { id: 1, title: 'A Day at the Zoo', thumbnail_url: null, scene_count: 10 },
            },
            {
              id: 'mock-storybook-2',
              title: 'A Day at the Zoo',
              character_name: 'Lucas',
              status: 'generating',
              progress: 60,
              created_at: yesterday.toISOString(),
              completed_at: null,
              thumbnail_url: 'https://via.placeholder.com/400x300/10B981/FFFFFF?text=Generating...',
              total_scenes: 10,
              character: { id: 'mock-character-2', name: 'Lucas' },
              template: { id: 1, title: 'A Day at the Zoo', thumbnail_url: null, scene_count: 10 },
            },
            {
              id: 'mock-storybook-3',
              title: 'A Day at the Zoo',
              character_name: 'Sophia',
              status: 'pending',
              progress: 0,
              created_at: now.toISOString(),
              completed_at: null,
              thumbnail_url: 'https://via.placeholder.com/400x300/6366F1/FFFFFF?text=Pending',
              total_scenes: 10,
              character: { id: 'mock-character-3', name: 'Sophia' },
              template: { id: 1, title: 'A Day at the Zoo', thumbnail_url: null, scene_count: 10 },
            },
          ],
          total: 3,
        } as T
      }
      // Individual storybook - return null to let it fail gracefully
      return null as T
    }
    // POST/PUT/DELETE - return mock success
    if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
      return { id: 'mock-id', message: 'Design mode: operation skipped' } as T
    }
  }

  // Mock characters data
  if (endpoint.startsWith('/characters')) {
    if (method === 'GET') {
      if (endpoint === '/characters') {
        return {
          characters: [
            {
              id: 'mock-character-1',
              name: 'Emma',
              front_photo_url: 'https://via.placeholder.com/200x200/4F46E5/FFFFFF?text=Emma',
              created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              storybooks: [{ count: 1 }],
            },
            {
              id: 'mock-character-2',
              name: 'Lucas',
              front_photo_url: 'https://via.placeholder.com/200x200/10B981/FFFFFF?text=Lucas',
              created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              storybooks: [{ count: 1 }],
            },
            {
              id: 'mock-character-3',
              name: 'Sophia',
              front_photo_url: 'https://via.placeholder.com/200x200/6366F1/FFFFFF?text=Sophia',
              created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              storybooks: [{ count: 1 }],
            },
          ],
        } as T
      }
      return null as T
    }
    // POST/PUT/DELETE - return mock success
    if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
      return { id: 'mock-id', message: 'Design mode: operation skipped' } as T
    }
  }

  // Mock templates data
  if (endpoint.startsWith('/story-templates') && method === 'GET') {
    if (endpoint === '/story-templates') {
      return {
        templates: [
          {
            id: 1,
            title: 'A Day at the Zoo',
            description: 'Join your character on an exciting adventure through the zoo, meeting amazing animals and learning about wildlife!',
            category: 'adventure',
            age_range: '3-8',
            scene_count: 10,
            cover_label: 'Zoo Adventure',
            thumbnail_url: 'https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=Day+at+the+Zoo',
            script_data: null,
          },
          {
            id: 2,
            title: 'Space Explorer',
            description: 'Blast off into space with your character as they explore planets, stars, and galaxies far away!',
            category: 'adventure',
            age_range: '4-10',
            scene_count: 12,
            cover_label: 'Space Journey',
            thumbnail_url: 'https://via.placeholder.com/400x300/8B5CF6/FFFFFF?text=Space+Explorer',
            script_data: null,
          },
          {
            id: 3,
            title: 'Under the Sea',
            description: 'Dive deep into the ocean and discover colorful fish, friendly dolphins, and mysterious sea creatures!',
            category: 'adventure',
            age_range: '3-7',
            scene_count: 8,
            cover_label: 'Ocean Adventure',
            thumbnail_url: 'https://via.placeholder.com/400x300/06B6D4/FFFFFF?text=Under+the+Sea',
            script_data: null,
          },
        ],
      } as T
    }
    return null as T
  }

  // Mock profile data
  if (endpoint === '/profile') {
    if (method === 'GET') {
      return {
        id: 'design-mode-user-id',
        email: 'design@example.com',
        stories_per_month: 1,
        stories_generated_this_month: 1,
        custom_stories_per_month: null,
        characters_count: 3,
        storybooks_count: 3,
      } as T
    }
    // PATCH - return mock success
    if (method === 'PATCH') {
      return { id: 'design-mode-user-id', message: 'Design mode: operation skipped' } as T
    }
  }

  return null as T
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // ✅ DESIGN_MODE: Return mock data in design mode
  const mockData = getMockData<T>(endpoint, options.method || 'GET')
  if (mockData !== null) {
    return mockData
  }

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
    // ✅ DESIGN_MODE: Return mock data in design mode
    if (isDesignMode()) {
      return Promise.resolve({ id, name: 'Mock Character' } as any)
    }
    
    return getAuthToken().then(async (token) => {
      if (!token) {
        throw new Error('Not authenticated')
      }
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
