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
      <div className={cn('mx-4 sm:mx-6 flex relative', containerClassName)}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type={type}
          className={cn(
            'pl-10 pr-10 h-10 sm:h-11 text-sm bg-muted border-none text-muted-foreground focus:text-foreground',
            className,
          )}
          ref={ref}
          placeholder={t("searchPlaceholder")}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          {...props}
        />
        <XCircle
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 cursor-pointer text-muted-foreground hover:text-foreground transition-colors',
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
