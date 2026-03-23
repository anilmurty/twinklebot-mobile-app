import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { storybooksApi } from '@/lib/api-client'

// Query keys for storybooks
export const storybookKeys = {
  all: ['storybooks'] as const,
  lists: () => [...storybookKeys.all, 'list'] as const,
  list: (status?: string) => [...storybookKeys.lists(), { status }] as const,
  details: () => [...storybookKeys.all, 'detail'] as const,
  detail: (id: string) => [...storybookKeys.details(), id] as const,
  status: (id: string) => [...storybookKeys.detail(id), 'status'] as const,
}

/**
 * Hook to fetch list of storybooks
 * Stale time: 2 minutes (storybooks change more frequently)
 */
export function useStorybooks(status?: string) {
  return useQuery({
    queryKey: storybookKeys.list(status),
    queryFn: () => storybooksApi.list(status),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook to fetch a single storybook
 * Stale time: 5 minutes
 */
export function useStorybook(id: string) {
  return useQuery({
    queryKey: storybookKeys.detail(id),
    queryFn: () => storybooksApi.get(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to poll storybook status during generation
 * Only polls when enabled (when storybook is generating)
 */
export function useStorybookStatus(id: string, enabled: boolean) {
  return useQuery({
    queryKey: storybookKeys.status(id),
    queryFn: () => storybooksApi.getStatus(id),
    enabled: enabled && !!id,
    refetchInterval: enabled ? 3000 : false, // Poll every 3 seconds when enabled
    staleTime: 0, // Always refetch when enabled
  })
}

/**
 * Hook to check if any storybooks are currently generating
 * Used to enable/disable polling
 */
export function useHasGeneratingStorybooks() {
  const { data } = useStorybooks()
  const storybooks = data?.storybooks || []
  return storybooks.some(sb => 
    sb.status === 'generating' || 
    sb.status === 'pending' || 
    sb.status === 'preview_pending'
  )
}

/**
 * Hook with smart polling - only refetches when there are generating storybooks
 */
export function useStorybooksWithPolling() {
  const queryClient = useQueryClient()
  const hasGenerating = useHasGeneratingStorybooks()
  
  return useQuery({
    queryKey: storybookKeys.list(),
    queryFn: () => storybooksApi.list(),
    staleTime: hasGenerating ? 0 : 2 * 60 * 1000,
    refetchInterval: hasGenerating ? 3000 : false,
  })
}

/**
 * Mutation to create a new storybook
 */
export function useCreateStorybook() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ characterId, templateId, lookId, style }: {
      characterId: string
      templateId: number
      lookId?: number | null
      style?: string
    }) => storybooksApi.create(characterId, templateId, lookId, style),
    onSuccess: () => {
      // Invalidate storybooks list to refetch
      queryClient.invalidateQueries({ queryKey: storybookKeys.lists() })
    },
  })
}

/**
 * Mutation to generate preview for a storybook
 */
export function useGeneratePreview() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => storybooksApi.generatePreview(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: storybookKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: storybookKeys.lists() })
    },
  })
}

/**
 * Mutation to trigger full generation for a storybook
 */
export function useTriggerGeneration() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => storybooksApi.triggerGeneration(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: storybookKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: storybookKeys.lists() })
    },
  })
}

/**
 * Mutation to resume storybook generation
 */
export function useResumeGeneration() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => storybooksApi.resumeGeneration(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: storybookKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: storybookKeys.lists() })
    },
  })
}

/**
 * Mutation to delete a storybook
 */
export function useDeleteStorybook() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => storybooksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storybookKeys.lists() })
    },
  })
}

/**
 * Mutation to generate share link
 */
export function useGenerateShare() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => storybooksApi.generateShare(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: storybookKeys.detail(id) })
    },
  })
}

/**
 * Mutation to revoke share link
 */
export function useRevokeShare() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => storybooksApi.revokeShare(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: storybookKeys.detail(id) })
    },
  })
}

