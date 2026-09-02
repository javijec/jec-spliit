"use client"

import * as React from "react"
import { Radio as RadioPrimitive } from "@base-ui/react/radio"
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

type RadioGroupProps = Omit<
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive>,
  "className" | "defaultValue" | "onValueChange" | "orientation" | "value"
> & {
  className?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  orientation?: "horizontal" | "vertical"
  value?: string
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, orientation, ...props }, ref) => (
    <RadioGroupPrimitive
      ref={ref}
      aria-orientation={orientation}
      className={cn("grid gap-2", className)}
      {...props}
    />
  ),
)
RadioGroup.displayName = "RadioGroup"

type RadioGroupItemProps = Omit<
  React.ComponentPropsWithoutRef<typeof RadioPrimitive.Root>,
  "className" | "nativeButton" | "render"
> & {
  className?: string
}

const RadioGroupItem = React.forwardRef<HTMLElement, RadioGroupItemProps>(
  ({ className, ...props }, ref) => (
    <RadioPrimitive.Root
      ref={ref}
      nativeButton
      render={<button type="button" />}
      className={cn(
        "peer aspect-square h-4 w-4 border border-input text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:border-primary data-[checked]:bg-primary data-[checked]:text-primary-foreground",
        className,
      )}
      {...props}
    >
      <RadioPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Root>
  ),
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
