"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { get, set, del } from 'idb-keyval'
import { useState, useEffect } from 'react'
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client'

/**
 * Create an IndexedDB persister for TanStack Query
 * This allows the cache to survive page refreshes
 */
function createIDBPersister(idbValidKey: IDBValidKey = 'twinklebot-query-cache'): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      await set(idbValidKey, client)
    },
    restoreClient: async () => {
      return await get<PersistedClient>(idbValidKey)
    },
    removeClient: async () => {
      await del(idbValidKey)
    },
  }
}

/**
 * Create a QueryClient with optimized defaults
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 5 minutes by default
        staleTime: 5 * 60 * 1000,
        // Cache is kept for 30 minutes after last use
        gcTime: 30 * 60 * 1000,
        // Refetch when window regains focus (good for tab switching)
        refetchOnWindowFocus: true,
        // Don't refetch on mount if data is still fresh
        refetchOnMount: false,
        // Retry failed requests once
        retry: 1,
        // Don't retry on 401/403 errors
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        // Retry mutations once
        retry: 1,
      },
    },
  })
}

// Singleton query client for the browser
let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always create a new query client
    return makeQueryClient()
  } else {
    // Browser: reuse existing client or create new one
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient()
    }
    return browserQueryClient
  }
}

interface QueryProviderProps {
  children: React.ReactNode
}

/**
 * Query Provider that wraps the app with TanStack Query + IndexedDB persistence
 * 
 * Features:
 * - Automatic caching with smart stale times
 * - Persists cache to IndexedDB (survives page refresh)
 * - Deduplicates concurrent requests
 * - Background refetching when data becomes stale
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => getQueryClient())
  const [persister, setPersister] = useState<Persister | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Only create persister on client side
    setIsClient(true)
    setPersister(createIDBPersister())
  }, [])

  // During SSR or before hydration, use regular QueryClientProvider
  if (!isClient || !persister) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }

  // Once on client with persister ready, use PersistQueryClientProvider
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        // Max age of persisted cache: 24 hours
        maxAge: 1000 * 60 * 60 * 24,
        // Cache buster - increment this to invalidate all cached data
        // v2: Fixed image URLs (reverted proxy URLs to signed URLs)
        buster: 'v2',
      }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}

