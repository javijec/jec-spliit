"use client"

import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const DropdownMenu = MenuPrimitive.Root

type DropdownMenuTriggerProps =
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.Trigger> & {
    asChild?: boolean
  }

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuTriggerProps
>(({ asChild = false, children, ...props }, ref) => {
  if (asChild) {
    return (
      <MenuPrimitive.Trigger
        ref={ref}
        render={React.Children.only(children) as React.ReactElement}
        {...props}
      />
    )
  }

  return (
    <MenuPrimitive.Trigger ref={ref} {...props}>
      {children}
    </MenuPrimitive.Trigger>
  )
})
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuGroup = MenuPrimitive.Group

const DropdownMenuPortal = MenuPrimitive.Portal

const DropdownMenuSub = MenuPrimitive.SubmenuRoot

const DropdownMenuRadioGroup = MenuPrimitive.RadioGroup

type DropdownMenuSubTriggerProps =
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.SubmenuTrigger> & {
    inset?: boolean
    asChild?: boolean
  }

const DropdownMenuSubTrigger = React.forwardRef<
  HTMLElement,
  DropdownMenuSubTriggerProps
>(({ asChild = false, className, inset, children, ...props }, ref) => (
  <MenuPrimitive.SubmenuTrigger
    ref={ref}
    className={cn(
      "flex min-h-10 cursor-default select-none items-center px-2 py-2 text-sm outline-none data-[highlighted]:bg-accent data-[open]:bg-accent",
      inset && "pl-8",
      className,
    )}
    render={
      asChild
        ? (React.Children.only(children) as React.ReactElement)
        : undefined
    }
    {...props}
  >
    {asChild ? null : (
      <>
        {children}
        <ChevronRight className="ml-auto h-4 w-4" />
      </>
    )}
  </MenuPrimitive.SubmenuTrigger>
))
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger"

type DropdownMenuSubContentProps =
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.Popup> &
    Pick<
      React.ComponentPropsWithoutRef<typeof MenuPrimitive.Positioner>,
      "align" | "side" | "sideOffset" | "alignOffset"
    > & {
      forceMount?: boolean
    }

const DropdownMenuSubContent = React.forwardRef<
  HTMLDivElement,
  DropdownMenuSubContentProps
>(
  (
    {
      className,
      align,
      side,
      sideOffset = 4,
      alignOffset,
      forceMount,
      ...props
    },
    ref,
  ) => (
    <MenuPrimitive.Portal keepMounted={forceMount}>
      <MenuPrimitive.Positioner
        align={align}
        side={side}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
      >
        <MenuPrimitive.Popup
          ref={ref}
          className={cn(
            "z-50 min-w-[8rem] overflow-hidden border bg-popover p-1 text-popover-foreground shadow-sm data-[starting-style]:animate-in data-[ending-style]:animate-out data-[starting-style]:fade-in-0 data-[ending-style]:fade-out-0",
            "max-h-[80vh] overflow-y-scroll",
            className,
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  ),
)
DropdownMenuSubContent.displayName = "DropdownMenuSubContent"

type DropdownMenuContentProps =
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.Popup> &
    Pick<
      React.ComponentPropsWithoutRef<typeof MenuPrimitive.Positioner>,
      "align" | "side" | "sideOffset"
    > & {
      forceMount?: boolean
    }

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  DropdownMenuContentProps
>(
  (
    {
      className,
      align = "center",
      side = "bottom",
      sideOffset = 4,
      forceMount,
      ...props
    },
    ref,
  ) => (
    <MenuPrimitive.Portal keepMounted={forceMount}>
      <MenuPrimitive.Positioner
        align={align}
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          ref={ref}
          className={cn(
            "z-50 min-w-[8rem] overflow-hidden border bg-popover p-1 text-popover-foreground shadow-sm data-[starting-style]:animate-in data-[ending-style]:animate-out data-[starting-style]:fade-in-0 data-[ending-style]:fade-out-0",
            "max-h-[80vh] overflow-y-scroll",
            className,
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  ),
)
DropdownMenuContent.displayName = "DropdownMenuContent"

type DropdownMenuItemProps =
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.Item> & {
    inset?: boolean
    asChild?: boolean
  }

const DropdownMenuItem = React.forwardRef<HTMLElement, DropdownMenuItemProps>(
  ({ asChild = false, className, inset, children, ...props }, ref) => (
    <MenuPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex min-h-10 cursor-default select-none items-center px-2 py-2 text-sm outline-none transition-colors data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        inset && "pl-8",
        className,
      )}
      render={
        asChild
          ? (React.Children.only(children) as React.ReactElement)
          : undefined
      }
      {...props}
    >
      {asChild ? null : children}
    </MenuPrimitive.Item>
  ),
)
DropdownMenuItem.displayName = "DropdownMenuItem"

type DropdownMenuCheckboxItemProps =
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.CheckboxItem> & {
    asChild?: boolean
  }

const DropdownMenuCheckboxItem = React.forwardRef<
  HTMLElement,
  DropdownMenuCheckboxItemProps
>(
  ({ asChild = false, className, children, ...props }, ref) => (
    <MenuPrimitive.CheckboxItem
      ref={ref}
      className={cn(
        "relative flex min-h-10 cursor-default select-none items-center py-2 pl-8 pr-2 text-sm outline-none transition-colors data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      render={
        asChild
          ? (React.Children.only(children) as React.ReactElement)
          : undefined
      }
      {...props}
    >
      {asChild ? null : (
        <>
          <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            <MenuPrimitive.CheckboxItemIndicator>
              <Check className="h-4 w-4" />
            </MenuPrimitive.CheckboxItemIndicator>
          </span>
          {children}
        </>
      )}
    </MenuPrimitive.CheckboxItem>
  ),
)
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem"

type DropdownMenuRadioItemProps =
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.RadioItem> & {
    asChild?: boolean
  }

const DropdownMenuRadioItem = React.forwardRef<
  HTMLElement,
  DropdownMenuRadioItemProps
>(({ asChild = false, className, children, ...props }, ref) => (
  <MenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex min-h-10 cursor-default select-none items-center py-2 pl-8 pr-2 text-sm outline-none transition-colors data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    render={
      asChild
        ? (React.Children.only(children) as React.ReactElement)
        : undefined
    }
    {...props}
  >
    {asChild ? null : (
      <>
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <MenuPrimitive.RadioItemIndicator>
            <Circle className="h-2 w-2 fill-current" />
          </MenuPrimitive.RadioItemIndicator>
        </span>
        {children}
      </>
    )}
  </MenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem"

type DropdownMenuLabelProps =
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.GroupLabel> & {
    inset?: boolean
  }

const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  DropdownMenuLabelProps
>(({ className, inset, ...props }, ref) => (
  <MenuPrimitive.GroupLabel
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = "DropdownMenuLabel"

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <MenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
