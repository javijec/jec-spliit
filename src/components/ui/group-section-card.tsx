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
      '-mx-3 overflow-hidden rounded-none border-x-0 bg-card sm:mx-0 sm:rounded-md sm:border-x',
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
    className={cn('border-b p-4 sm:p-5', className)}
    {...props}
  />
))
GroupSectionHeader.displayName = 'GroupSectionHeader'

const GroupSectionContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <CardContent ref={ref} className={cn('p-4 sm:p-6', className)} {...props} />
))
GroupSectionContent.displayName = 'GroupSectionContent'

export {
  GroupSectionCard,
  GroupSectionContent,
  GroupSectionHeader,
  CardTitle as GroupSectionTitle,
  CardDescription as GroupSectionDescription,
}
