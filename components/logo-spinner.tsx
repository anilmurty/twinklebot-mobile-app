/**
 * Animated logo spinner — replaces generic Loader2 spinners.
 * Uses the Twinklebot favicon (book with face + star) with a pulse animation.
 */

interface LogoSpinnerProps {
  className?: string
  /** Size in pixels (default 24) */
  size?: number
}

export function LogoSpinner({ className = "", size = 24 }: LogoSpinnerProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={`animate-pulse ${className}`}
    >
      <rect fill="#fef3c7" width="32" height="32" rx="6" ry="6" />
      <path
        fill="#d97706"
        d="M22.5 6h3.5c0.8 0 1.5 0.3 2 0.8s0.8 1.2 0.8 2v14c0 0.8-0.3 1.5-0.8 2s-1.2 0.8-2 0.8h-3.5c-1.5 0-3 0.2-4 0.8-0.5 0.3-1.2 0.1-1.5-0.4v-1c0-0.5 0.3-0.9 0.7-1 1-0.3 2-0.4 3-0.4h3c0.3 0 0.6-0.3 0.6-0.6V9.5c0-0.3-0.3-0.6-0.6-0.6h-3c-1 0-2 0.3-2.8 0.8-0.8 0.5-1.4 1.2-1.9 2-0.2 0.4-0.6 0.7-1 0.8-0.4 0.1-0.9-0.1-1.2-0.4-0.3-0.3-0.6-0.6-0.8-1-0.5-0.8-1.1-1.5-1.9-2-0.8-0.5-1.7-0.8-2.8-0.8h-3c-0.3 0-0.6 0.3-0.6 0.6v7c0 0.6-0.4 1-1 1h-0.5c-0.5 0-1-0.4-1-1V8.8c0-0.8 0.3-1.5 0.8-2s1.2-0.8 2-0.8h3.5c1.5 0 2.8 0.5 4 1.3 0.8 0.6 1.5 1.3 2 2.2 0.5-0.9 1.2-1.6 2-2.2 1.2-0.8 2.5-1.3 4-1.3z"
      />
      <circle fill="#78350f" cx="11" cy="14" r="2" />
      <circle fill="#78350f" cx="21" cy="14" r="2" />
      <path
        d="M12 18.5c0 0 2 2.5 4 2.5s4-2.5 4-2.5"
        stroke="#78350f"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        fill="#f59e0b"
        d="M8 24l1.5 0.7 0.7 1.5c0.2 0.4 0.8 0.4 1 0l0.7-1.5 1.5-0.7c0.4-0.2 0.4-0.8 0-1l-1.5-0.7-0.7-1.5c-0.2-0.4-0.8-0.4-1 0l-0.7 1.5-1.5 0.7c-0.4 0.2-0.4 0.8 0 1z"
      />
    </svg>
  )
}
