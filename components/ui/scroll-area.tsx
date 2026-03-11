'use client'

import * as React from 'react'
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'

import { cn } from '@/lib/utils'

function ScrollArea({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn('relative', className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
          data-slot="scroll-area-viewport"
          className="w-full h-full overflow-auto focus-visible:ring-ring/50 rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
        >
        {children}
      </ScrollAreaPrimitive.Viewport>
        {/* horizontal scrollbar for wide content */}
        <ScrollBar orientation="horizontal" className="flex" />
        {/* vertical scrollbar */}
        <ScrollBar orientation="vertical" />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        'flex touch-none transition-colors select-none relative',
        orientation === 'vertical' &&
          'h-full w-3 p-1 bg-brand-navy/95 rounded-l-lg',
        orientation === 'horizontal' &&
          'h-3 flex-col p-1 bg-brand-navy/95 rounded-t-lg',
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="bg-brand-orange flex-1 rounded-full shadow-[inset_0_0_0_2px_rgba(0,0,0,0.06)]"
      />
      {/* small triangular indicator at the bottom of the scrollbar */}
      {orientation === 'vertical' && (
        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-1 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-brand-orange" />
      )}
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }
