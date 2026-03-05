"use client"

import { useState, useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { storybookKeys, characterKeys, templateKeys } from "@/lib/queries"
import { storybooksApi, charactersApi, templatesApi } from "@/lib/api-client"

const SAFETY_TIMEOUT_MS = 4000
const MAX_PRELOAD_IMAGES = 6

export function usePrefetch(userReady: boolean): boolean {
  const [dataReady, setDataReady] = useState(false)
  const started = useRef(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userReady || started.current) return
    started.current = true

    const safetyTimer = setTimeout(() => {
      setDataReady(true)
    }, SAFETY_TIMEOUT_MS)

    Promise.allSettled([
      queryClient.fetchQuery({
        queryKey: storybookKeys.list(),
        queryFn: () => storybooksApi.list(),
        staleTime: 2 * 60 * 1000,
      }),
      queryClient.fetchQuery({
        queryKey: characterKeys.list(),
        queryFn: () => charactersApi.list(),
        staleTime: 10 * 60 * 1000,
      }),
      queryClient.fetchQuery({
        queryKey: templateKeys.list(),
        queryFn: () => templatesApi.list(),
        staleTime: 30 * 60 * 1000,
      }),
    ]).then((results) => {
      // Preload thumbnail images (fire-and-forget)
      const urls: string[] = []

      const storybooksResult = results[0]
      if (storybooksResult.status === "fulfilled" && storybooksResult.value?.storybooks) {
        for (const sb of storybooksResult.value.storybooks) {
          if (sb.thumbnail_url) urls.push(sb.thumbnail_url)
        }
      }

      const templatesResult = results[2]
      if (templatesResult.status === "fulfilled" && templatesResult.value?.templates) {
        for (const t of templatesResult.value.templates) {
          if (t.thumbnail_url) urls.push(t.thumbnail_url)
        }
      }

      urls.slice(0, MAX_PRELOAD_IMAGES).forEach((url) => {
        const img = new Image()
        img.src = url
      })

      clearTimeout(safetyTimer)
      setDataReady(true)
    })

    return () => clearTimeout(safetyTimer)
  }, [userReady, queryClient])

  return dataReady
}
