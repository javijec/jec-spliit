import * as React from 'react'

import { cn } from '@/lib/utils'

type PageContainerProps = React.HTMLAttributes<HTMLElement> & {
  as?: keyof React.JSX.IntrinsicElements
  width?: 'default' | 'narrow' | 'wide' | 'form'
}

const widthClassName: Record<NonNullable<PageContainerProps['width']>, string> = {
  default: 'max-w-screen-xl gap-4 sm:py-6',
  narrow: 'max-w-3xl gap-4 sm:py-6',
  wide: 'max-w-6xl gap-5 sm:py-6',
  form: 'max-w-screen-sm gap-4 py-6 sm:py-8',
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
        'relative z-10 mx-auto flex w-full flex-1 flex-col px-3 py-4 sm:px-5 lg:px-8',
        widthClassName[width],
        className,
      )}
      {...props}
    />
  )
}
