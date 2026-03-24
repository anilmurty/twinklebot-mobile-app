"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface ImageWithShimmerProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Wrapper className for the container div */
  containerClassName?: string
}

/**
 * Image component that shows a shimmer animation while loading.
 * Drop-in replacement for <img> — just swap the tag name.
 */
export function ImageWithShimmer({
  containerClassName,
  className,
  onLoad,
  onError,
  alt,
  ...props
}: ImageWithShimmerProps) {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      {/* Shimmer placeholder — visible until image loads */}
      {!loaded && !errored && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      <img
        alt={alt}
        className={cn(
          "transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
          className
        )}
        onLoad={(e) => {
          setLoaded(true)
          onLoad?.(e)
        }}
        onError={(e) => {
          setErrored(true)
          onError?.(e)
        }}
        {...props}
      />
    </div>
  )
}
