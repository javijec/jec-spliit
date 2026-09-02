"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider
const Tooltip = TooltipPrimitive.Root

type TooltipTriggerProps =
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger> & {
    asChild?: boolean
  }

const TooltipTrigger = React.forwardRef<HTMLButtonElement, TooltipTriggerProps>(
  ({ asChild = false, children, ...props }, ref) => {
    if (asChild) {
      return (
        <TooltipPrimitive.Trigger
          ref={ref}
          render={React.Children.only(children) as React.ReactElement}
          {...props}
        />
      )
    }

    return (
      <TooltipPrimitive.Trigger ref={ref} {...props}>
        {children}
      </TooltipPrimitive.Trigger>
    )
  },
)
TooltipTrigger.displayName = "TooltipTrigger"

type TooltipPositionerProps = React.ComponentPropsWithoutRef<
  typeof TooltipPrimitive.Positioner
>

type TooltipContentProps =
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Popup> &
    Pick<TooltipPositionerProps, "align" | "side" | "sideOffset">

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  (
    {
      className,
      align = "center",
      side = "top",
      sideOffset = 4,
      ...props
    },
    ref,
  ) => (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        side={side}
        sideOffset={sideOffset}
      >
        <TooltipPrimitive.Popup
          ref={ref}
          role="tooltip"
          className={cn(
            "z-50 max-w-xs rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground shadow-md outline-none data-[starting-style]:animate-in data-[ending-style]:animate-out data-[starting-style]:fade-in-0 data-[ending-style]:fade-out-0",
            className,
          )}
          {...props}
        />
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  ),
)
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
