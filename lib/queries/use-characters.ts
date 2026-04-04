import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { charactersApi } from '@/lib/api-client'

// Query keys for characters
export const characterKeys = {
  all: ['characters'] as const,
  lists: () => [...characterKeys.all, 'list'] as const,
  list: () => [...characterKeys.lists()] as const,
  details: () => [...characterKeys.all, 'detail'] as const,
  detail: (id: string) => [...characterKeys.details(), id] as const,
}

/**
 * Hook to fetch list of characters
 * Stale time: 10 minutes (characters change less frequently)
 */
export function useCharacters() {
  return useQuery({
    queryKey: characterKeys.list(),
    queryFn: () => charactersApi.list(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to fetch a single character
 * Stale time: 10 minutes
 */
export function useCharacter(id: string) {
  return useQuery({
    queryKey: characterKeys.detail(id),
    queryFn: () => charactersApi.get(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Mutation to create a new character
 */
export function useCreateCharacter() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: { name: string; gender: "male" | "female"; photo_path: string }) => 
      charactersApi.create(data),
    onSuccess: () => {
      // Invalidate characters list to refetch
      queryClient.invalidateQueries({ queryKey: characterKeys.lists() })
    },
  })
}

/**
 * Mutation to update a character
 */
export function useUpdateCharacter() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) => 
      charactersApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: characterKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: characterKeys.lists() })
    },
  })
}

/**
 * Mutation to delete a character
 */
export function useDeleteCharacter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => charactersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: characterKeys.lists() })
      // Storybooks are cascade-deleted with the character, so refresh that cache too
      queryClient.invalidateQueries({ queryKey: ['storybooks'] })
    },
  })
}

