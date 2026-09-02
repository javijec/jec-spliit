"use client"

import * as React from "react"
import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible"

const Collapsible = CollapsiblePrimitive.Root

type CollapsibleTriggerProps =
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger> & {
    asChild?: boolean
  }

const CollapsibleTrigger = React.forwardRef<
  HTMLButtonElement,
  CollapsibleTriggerProps
>(({ asChild = false, children, ...props }, ref) => {
  if (asChild) {
    return (
      <CollapsiblePrimitive.Trigger
        ref={ref}
        render={React.Children.only(children) as React.ReactElement}
        {...props}
      />
    )
  }

  return (
    <CollapsiblePrimitive.Trigger ref={ref} {...props}>
      {children}
    </CollapsiblePrimitive.Trigger>
  )
})
CollapsibleTrigger.displayName = "CollapsibleTrigger"

type CollapsibleContentProps =
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Panel> & {
    forceMount?: boolean
  }

const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  CollapsibleContentProps
>(({ forceMount, keepMounted, ...props }, ref) => (
  <CollapsiblePrimitive.Panel
    ref={ref}
    keepMounted={forceMount ?? keepMounted}
    {...props}
  />
))
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
