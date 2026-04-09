import * as React from 'react'

import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const GroupSectionCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Card
    ref={ref}
    className={cn(
      '-mx-3 overflow-hidden rounded-none border-x-0 border-border/70 bg-card shadow-none sm:mx-0 sm:rounded-[1.35rem] sm:border-x sm:shadow-[0_14px_34px_hsl(var(--foreground)/0.05)]',
      className,
    )}
    {...props}
  />
))
GroupSectionCard.displayName = 'GroupSectionCard'

const GroupSectionHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <CardHeader
    ref={ref}
    className={cn('border-b border-border/70 px-4 py-3.5 sm:px-5 sm:py-4', className)}
    {...props}
  />
))
GroupSectionHeader.displayName = 'GroupSectionHeader'

const GroupSectionContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <CardContent
    ref={ref}
    className={cn('px-4 py-3.5 sm:px-5 sm:py-4', className)}
    {...props}
  />
))
GroupSectionContent.displayName = 'GroupSectionContent'

export {
  GroupSectionCard,
  GroupSectionContent,
  GroupSectionHeader,
  CardTitle as GroupSectionTitle,
  CardDescription as GroupSectionDescription,
}
