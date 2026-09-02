"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

type DialogTriggerProps =
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger> & {
    asChild?: boolean
  }

const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ asChild = false, children, ...props }, ref) => {
    if (asChild) {
      return (
        <DialogPrimitive.Trigger
          ref={ref}
          render={React.Children.only(children) as React.ReactElement}
          {...props}
        />
      )
    }

    return (
      <DialogPrimitive.Trigger ref={ref} {...props}>
        {children}
      </DialogPrimitive.Trigger>
    )
  },
)
DialogTrigger.displayName = "DialogTrigger"

const DialogPortal = DialogPrimitive.Portal

type DialogCloseProps =
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close> & {
    asChild?: boolean
  }

const DialogClose = React.forwardRef<HTMLButtonElement, DialogCloseProps>(
  ({ asChild = false, children, ...props }, ref) => (
    <DialogPrimitive.Close
      ref={ref}
      render={
        asChild
          ? (React.Children.only(children) as React.ReactElement)
          : undefined
      }
      {...props}
    >
      {asChild ? null : children}
    </DialogPrimitive.Close>
  ),
)
DialogClose.displayName = "DialogClose"

const DialogOverlay = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Backdrop>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Backdrop
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/45 data-[starting-style]:animate-in data-[ending-style]:animate-out data-[starting-style]:fade-in-0 data-[ending-style]:fade-out-0",
      className,
    )}
    {...props}
  />
))
DialogOverlay.displayName = "DialogOverlay"

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Popup>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Viewport className="pointer-events-none fixed inset-0 z-50 flex min-h-full items-center justify-center overflow-y-auto p-2 sm:p-4">
      <DialogPrimitive.Popup
        ref={ref}
        className={cn(
          "pointer-events-auto relative grid w-[calc(100vw-1rem)] max-h-[calc(100dvh-1rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] max-w-lg gap-4 overflow-y-auto overscroll-contain rounded-xl border border-border/80 bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] shadow-[0_12px_36px_hsl(var(--foreground)/0.14)] duration-150 data-[starting-style]:animate-in data-[ending-style]:animate-out data-[starting-style]:fade-in-0 data-[ending-style]:fade-out-0 sm:max-h-[calc(100dvh-2rem)] sm:w-full sm:p-6",
          className,
        )}
        {...props}
      >
        {children}
        <DialogClose className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-background text-muted-foreground shadow-sm ring-offset-background transition-[background-color,color,border-color] hover:border-border hover:bg-secondary/80 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
      </DialogPrimitive.Popup>
    </DialogPrimitive.Viewport>
  </DialogPortal>
))
DialogContent.displayName = "DialogContent"

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 pr-12 text-center sm:text-left",
      className,
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className,
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-tight tracking-tight",
      className,
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm leading-6 text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
