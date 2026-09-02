"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"

import { cn } from "@/lib/utils"

const Drawer = (props: React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root swipeDirection="down" {...props} />
)
Drawer.displayName = "Drawer"

type DrawerTriggerProps =
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Trigger> & {
    asChild?: boolean
  }

const DrawerTrigger = React.forwardRef<HTMLButtonElement, DrawerTriggerProps>(
  ({ asChild = false, children, ...props }, ref) => (
    <DrawerPrimitive.Trigger
      ref={ref}
      render={
        asChild
          ? (React.Children.only(children) as React.ReactElement)
          : undefined
      }
      {...props}
    >
      {asChild ? null : children}
    </DrawerPrimitive.Trigger>
  ),
)
DrawerTrigger.displayName = "DrawerTrigger"

const DrawerPortal = DrawerPrimitive.Portal

type DrawerCloseProps =
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Close> & {
    asChild?: boolean
  }

const DrawerClose = React.forwardRef<HTMLButtonElement, DrawerCloseProps>(
  ({ asChild = false, children, ...props }, ref) => (
    <DrawerPrimitive.Close
      ref={ref}
      render={
        asChild
          ? (React.Children.only(children) as React.ReactElement)
          : undefined
      }
      {...props}
    >
      {asChild ? null : children}
    </DrawerPrimitive.Close>
  ),
)
DrawerClose.displayName = "DrawerClose"

const DrawerOverlay = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Backdrop>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Backdrop
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 data-[swiping]:transition-none",
      className,
    )}
    {...props}
  />
))
DrawerOverlay.displayName = "DrawerOverlay"

const DrawerContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DrawerPrimitive.VirtualKeyboardProvider>
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Viewport className="pointer-events-none fixed inset-0 z-50 flex min-h-full items-end justify-center overflow-y-auto">
        <DrawerPrimitive.Popup
          className={cn(
            "pointer-events-auto relative flex max-h-[min(85dvh,42rem)] w-full flex-col overflow-hidden rounded-t-[1.6rem] border border-border/80 bg-background/98 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_36px_hsl(var(--foreground)/0.14)] transition-transform duration-300 [transform:translateY(calc(var(--drawer-swipe-movement-y,0px)+var(--drawer-snap-point-offset,0px)))] data-[swiping]:transition-none data-[ending-style]:translate-y-full",
          )}
        >
          <div className="mx-auto mt-3.5 h-1.5 w-14 shrink-0 rounded-full bg-border/90" />
          <DrawerPrimitive.Content
            ref={ref}
            className={cn(
              "min-h-0 flex-1 overflow-y-auto overscroll-contain",
              className,
            )}
            {...props}
          >
            {children}
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPortal>
  </DrawerPrimitive.VirtualKeyboardProvider>
))
DrawerContent.displayName = "DrawerContent"

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-1.5 px-4 pb-4 pt-3 text-center sm:px-5 sm:text-left", className)}
    {...props}
  />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex flex-col gap-2 px-4 pb-4 pt-3 sm:px-5", className)}
    {...props}
  />
)
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-tight tracking-tight",
      className,
    )}
    {...props}
  />
))
DrawerTitle.displayName = "DrawerTitle"

const DrawerDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm leading-6 text-muted-foreground", className)}
    {...props}
  />
))
DrawerDescription.displayName = "DrawerDescription"

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
