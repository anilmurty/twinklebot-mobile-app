"use client"

import { useEffect } from 'react'
import { initCapacitor } from '@/lib/utils/capacitor-init'

export function CapacitorInitializer() {
  useEffect(() => {
    initCapacitor()
  }, [])
  return null
}
