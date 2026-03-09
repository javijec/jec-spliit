import * as React from 'react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { Search, XCircle } from 'lucide-react'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange?: (value: string) => void
  containerClassName?: string
}

const SearchBar = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, onValueChange, containerClassName, ...props }, ref) => {
    const t = useTranslations('Expenses')
    const [value, _setValue] = React.useState('')

    const setValue = (v: string) => {
      _setValue(v)
      onValueChange && onValueChange(v)
    }

    return (
      <div className={cn('mx-4 flex relative sm:mx-6', containerClassName)}>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type={type}
          className={cn(
            'h-10 border-border bg-background pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground sm:h-11',
            className,
          )}
          ref={ref}
          placeholder={t('searchPlaceholder')}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          {...props}
        />
        <XCircle
          className={cn(
            'absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-foreground',
            !value && 'hidden',
          )}
          onClick={() => setValue('')}
        />
      </div>
    )
  },
)
SearchBar.displayName = 'SearchBar'

export { SearchBar }
