import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profileApi, subscriptionsApi, subscriptionPlansApi } from '@/lib/api-client'

// Query keys for profile
export const profileKeys = {
  all: ['profile'] as const,
  current: () => [...profileKeys.all, 'current'] as const,
}

// Query keys for subscriptions
export const subscriptionKeys = {
  all: ['subscriptions'] as const,
  status: () => [...subscriptionKeys.all, 'status'] as const,
  plans: () => [...subscriptionKeys.all, 'plans'] as const,
}

/**
 * Hook to fetch current user profile
 * Stale time: 5 minutes
 */
export function useProfile() {
  return useQuery({
    queryKey: profileKeys.current(),
    queryFn: () => profileApi.get(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Mutation to update profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: { full_name?: string; avatar_url?: string }) => 
      profileApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.current() })
    },
  })
}

/**
 * Hook to fetch subscription status
 * Stale time: 5 minutes
 */
export function useSubscriptionStatus() {
  return useQuery({
    queryKey: subscriptionKeys.status(),
    queryFn: () => subscriptionsApi.getStatus(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to fetch subscription plans
 * Stale time: 30 minutes (plans rarely change)
 */
export function useSubscriptionPlans() {
  return useQuery({
    queryKey: subscriptionKeys.plans(),
    queryFn: () => subscriptionPlansApi.list(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

