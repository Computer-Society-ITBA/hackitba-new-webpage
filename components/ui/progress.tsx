'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'

import { cn } from '@/lib/utils'

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        'relative w-full overflow-hidden rounded-full bg-brand-navy/80 border border-white/5',
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="relative bg-white/95 h-full rounded-full transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      >
        {/* triangular handle at the right edge of the indicator */}
        <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-5 border-l-transparent border-r-5 border-r-transparent border-t-6 border-t-white/95" />
      </ProgressPrimitive.Indicator>
    </ProgressPrimitive.Root>
  )
}

export { Progress }
