"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

type PopoverTriggerProps =
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger> & {
    asChild?: boolean
  }

const PopoverTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  ({ asChild = false, children, ...props }, ref) => {
    if (asChild) {
      return (
        <PopoverPrimitive.Trigger
          ref={ref}
          render={React.Children.only(children) as React.ReactElement}
          {...props}
        />
      )
    }

    return (
      <PopoverPrimitive.Trigger ref={ref} {...props}>
        {children}
      </PopoverPrimitive.Trigger>
    )
  },
)
PopoverTrigger.displayName = "PopoverTrigger"

type PopoverPositionerProps = React.ComponentPropsWithoutRef<
  typeof PopoverPrimitive.Positioner
>

type PopoverContentProps =
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Popup> &
    Pick<PopoverPositionerProps, "align" | "side" | "sideOffset">

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  (
    {
      className,
      align = "center",
      side = "bottom",
      sideOffset = 4,
      ...props
    },
    ref,
  ) => (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        side={side}
        sideOffset={sideOffset}
      >
        <PopoverPrimitive.Popup
          ref={ref}
          className={cn(
            "z-50 w-72 border bg-popover p-4 text-popover-foreground shadow-sm outline-none data-[starting-style]:animate-in data-[ending-style]:animate-out data-[starting-style]:fade-in-0 data-[ending-style]:fade-out-0",
            className,
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  ),
)
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }
