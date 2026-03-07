import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { templatesApi, characterLooksApi, storyInterestApi } from '@/lib/api-client'

// Query keys for templates
export const templateKeys = {
  all: ['templates'] as const,
  lists: () => [...templateKeys.all, 'list'] as const,
  list: () => [...templateKeys.lists()] as const,
  details: () => [...templateKeys.all, 'detail'] as const,
  detail: (id: number) => [...templateKeys.details(), id] as const,
}

// Query keys for character looks
export const lookKeys = {
  all: ['looks'] as const,
  byTemplate: (templateId: number, gender: 'male' | 'female') => 
    [...lookKeys.all, templateId, gender] as const,
}

/**
 * Hook to fetch list of story templates
 * Stale time: 30 minutes (templates rarely change)
 */
export function useTemplates() {
  return useQuery({
    queryKey: templateKeys.list(),
    queryFn: () => templatesApi.list(),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
  })
}

/**
 * Hook to fetch a single template
 * Stale time: 30 minutes
 */
export function useTemplate(id: number) {
  return useQuery({
    queryKey: templateKeys.detail(id),
    queryFn: () => templatesApi.get(id),
    enabled: !!id,
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Hook to fetch character looks for a template
 * Stale time: 30 minutes (looks rarely change)
 */
export function useCharacterLooks(templateId: number, gender: 'male' | 'female') {
  return useQuery({
    queryKey: lookKeys.byTemplate(templateId, gender),
    queryFn: () => characterLooksApi.list(templateId, gender),
    enabled: !!templateId && !!gender,
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Hook to record interest in a coming-soon template ("Notify Me")
 * On success, invalidates template lists to refresh interest state
 */
export function useNotifyInterest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (templateId: number) => storyInterestApi.notify(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() })
    },
  })
}

