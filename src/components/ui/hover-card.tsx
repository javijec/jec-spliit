"use client"

import * as React from "react"
import { PreviewCard } from "@base-ui/react/preview-card"

import { cn } from "@/lib/utils"

const HoverCard = PreviewCard.Root
const HoverCardTrigger = PreviewCard.Trigger

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof PreviewCard.Popup>,
  React.ComponentPropsWithoutRef<typeof PreviewCard.Popup> & {
    align?: React.ComponentPropsWithoutRef<typeof PreviewCard.Positioner>["align"]
    sideOffset?: React.ComponentPropsWithoutRef<typeof PreviewCard.Positioner>["sideOffset"]
  }
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PreviewCard.Portal>
    <PreviewCard.Positioner align={align} sideOffset={sideOffset}>
      <PreviewCard.Popup
        ref={ref}
        className={cn(
          "z-50 w-64 border bg-popover p-4 text-popover-foreground shadow-sm outline-none data-[open]:animate-in data-[open]:fade-in-0",
          className
        )}
        {...props}
      />
    </PreviewCard.Positioner>
  </PreviewCard.Portal>
))
HoverCardContent.displayName = "HoverCardContent"

export { HoverCard, HoverCardTrigger, HoverCardContent }
