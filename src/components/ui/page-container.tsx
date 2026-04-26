import * as React from 'react'

import { cn } from '@/lib/utils'

type PageContainerProps = React.HTMLAttributes<HTMLElement> & {
  as?: keyof React.JSX.IntrinsicElements
  width?: 'default' | 'narrow'
}

const widthClassName: Record<NonNullable<PageContainerProps['width']>, string> = {
  default: 'max-w-screen-xl gap-5 sm:py-6',
  narrow: 'max-w-3xl',
}

export function PageContainer({
  as: Component = 'div',
  width = 'default',
  className,
  ...props
}: PageContainerProps) {
  return (
    <Component
      className={cn(
        'mx-auto flex w-full flex-1 flex-col px-3 py-4 sm:px-4 lg:px-8',
        widthClassName[width],
        className,
      )}
      {...props}
    />
  )
}
