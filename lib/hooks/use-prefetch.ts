"use client"

import { useState, useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { storybookKeys, characterKeys, templateKeys } from "@/lib/queries"
import { storybooksApi, charactersApi, templatesApi } from "@/lib/api-client"

const SAFETY_TIMEOUT_MS = 10000  // Hard cap: 10 seconds max splash
const MIN_DISPLAY_MS = 1800      // Minimum splash so animations play
const PRIORITY_IMAGE_COUNT = 8   // Wait for these many images to load before dismissing
const MAX_PRELOAD_IMAGES = 30    // Total images to preload in background
const IMAGE_LOAD_TIMEOUT_MS = 8000 // Give up waiting for images after this

/**
 * Preload an image and return a promise that resolves when loaded or rejects on error.
 */
function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => reject()
    img.src = url
  })
}

export function usePrefetch(userReady: boolean): boolean {
  const [dataReady, setDataReady] = useState(false)
  const started = useRef(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userReady || started.current) return
    started.current = true

    const startTime = Date.now()

    const safetyTimer = setTimeout(() => {
      console.log('[PREFETCH] Safety timeout reached, dismissing splash')
      setDataReady(true)
    }, SAFETY_TIMEOUT_MS)

    const markReady = () => {
      clearTimeout(safetyTimer)
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed)
      if (remaining > 0) {
        setTimeout(() => setDataReady(true), remaining)
      } else {
        setDataReady(true)
      }
    }

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
      // Collect all thumbnail URLs, prioritized: storybooks first (default tab), then templates, then characters
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

      const charactersResult = results[1]
      if (charactersResult.status === "fulfilled" && charactersResult.value?.characters) {
        for (const ch of charactersResult.value.characters) {
          if (ch.front_photo_url) urls.push(ch.front_photo_url)
        }
      }

      if (urls.length === 0) {
        markReady()
        return
      }

      // Start ALL image preloads immediately (browser will parallelize)
      const allUrls = urls.slice(0, MAX_PRELOAD_IMAGES)
      const allPromises = allUrls.map(url => preloadImage(url))

      // But only wait for the first N (priority) images before dismissing splash
      const priorityPromises = allPromises.slice(0, PRIORITY_IMAGE_COUNT)

      const imageLoadPromise = Promise.allSettled(priorityPromises)

      const imageTimeout = new Promise<void>((resolve) =>
        setTimeout(() => {
          console.log('[PREFETCH] Image load timeout, proceeding')
          resolve()
        }, IMAGE_LOAD_TIMEOUT_MS)
      )

      Promise.race([imageLoadPromise, imageTimeout]).then(() => {
        const loaded = Date.now() - startTime
        console.log(`[PREFETCH] Priority images ready in ${loaded}ms`)
        markReady()
      })
    })

    return () => clearTimeout(safetyTimer)
  }, [userReady, queryClient])

  return dataReady
}
