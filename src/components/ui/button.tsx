import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background motion-safe:transition-[transform,colors,box-shadow,border-color] motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-primary text-primary-foreground shadow-[0_1px_2px_hsl(var(--primary)/0.22),0_3px_8px_hsl(var(--primary)/0.16)] hover:bg-primary/95 hover:shadow-[0_2px_6px_hsl(var(--primary)/0.24),0_8px_18px_hsl(var(--primary)/0.18)]",
        destructive:
          "border border-transparent bg-destructive text-destructive-foreground shadow-[0_1px_2px_hsl(var(--destructive)/0.24),0_4px_10px_hsl(var(--destructive)/0.15)] hover:bg-destructive/92 hover:shadow-[0_2px_6px_hsl(var(--destructive)/0.28),0_8px_18px_hsl(var(--destructive)/0.18)]",
        outline:
          "border border-border/90 bg-card/80 text-foreground shadow-sm hover:border-primary/20 hover:bg-secondary hover:text-secondary-foreground hover:shadow-md",
        secondary:
          "border border-transparent bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/88 hover:shadow-md",
        ghost:
          "text-muted-foreground hover:bg-secondary/75 hover:text-secondary-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 sm:h-10 px-4 py-2",
        sm: "h-10 sm:h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-11 w-11 sm:h-10 sm:w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
