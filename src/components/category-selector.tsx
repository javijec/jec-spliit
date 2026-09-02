import { ChevronDown, Loader2 } from 'lucide-react'

import { CategoryIcon } from '@/app/groups/[groupId]/expenses/category-icon'
import { Button, ButtonProps } from '@/components/ui/button'
import {
  Combobox,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useMediaQuery } from '@/lib/hooks'
import { Category } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { forwardRef, useEffect, useState } from 'react'

type Props = {
  categories: Category[]
  onValueChange: (categoryId: Category['id']) => void
  /** Category ID to be selected by default. Overwriting this value will update current selection, too. */
  defaultValue: Category['id']
  isLoading: boolean
}

export function CategorySelector({
  categories,
  onValueChange,
  defaultValue,
  isLoading,
}: Props) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState<number>(defaultValue)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  // allow overwriting currently selected category from outside
  useEffect(() => {
    setValue(defaultValue)
    onValueChange(defaultValue)
  }, [defaultValue, onValueChange])

  const selectedCategory =
    categories.find((category) => category.id === value) ?? categories[0]

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <CategoryButton
            category={selectedCategory}
            open={open}
            isLoading={isLoading}
          />
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start">
          <CategoryCommand
            categories={categories}
            onValueChange={(id) => {
              setValue(id)
              onValueChange(id)
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <CategoryButton
          category={selectedCategory}
          open={open}
          isLoading={isLoading}
        />
      </DrawerTrigger>
      <DrawerContent className="p-0">
        <CategoryCommand
          categories={categories}
          onValueChange={(id) => {
            setValue(id)
            onValueChange(id)
            setOpen(false)
          }}
        />
      </DrawerContent>
    </Drawer>
  )
}

function CategoryCommand({
  categories,
  onValueChange,
}: {
  categories: Category[]
  onValueChange: (categoryId: Category['id']) => void
}) {
  const t = useTranslations('Categories')
  const categoriesByGroup = categories.reduce<Record<string, Category[]>>(
    (acc, category) => ({
      ...acc,
      [category.grouping]: [...(acc[category.grouping] ?? []), category],
    }),
    {},
  )

  return (
    <Combobox<Category>
      items={categories}
      inline
      open
      itemToStringLabel={(category) =>
        `${category.id} ${t(`${category.grouping}.heading`)} ${t(
          `${category.grouping}.${category.name}`,
        )}`
      }
      onValueChange={(category) => {
        if (category) onValueChange(category.id)
      }}
    >
      <ComboboxInput
        aria-label={t('search')}
        placeholder={t('search')}
        className="text-base"
      />
      <ComboboxEmpty>{t('noCategory')}</ComboboxEmpty>
      <ComboboxList>
        {Object.entries(categoriesByGroup).map(
          ([group, groupCategories], index) => (
            <ComboboxGroup key={index} items={groupCategories}>
              <ComboboxGroupLabel>{t(`${group}.heading`)}</ComboboxGroupLabel>
              <ComboboxCollection>
                {(category) => (
                  <ComboboxItem key={category.id} value={category}>
                    <CategoryLabel category={category} />
                  </ComboboxItem>
                )}
              </ComboboxCollection>
            </ComboboxGroup>
          ),
        )}
      </ComboboxList>
    </Combobox>
  )
}

type CategoryButtonProps = {
  category: Category
  open: boolean
  isLoading: boolean
}
const CategoryButton = forwardRef<HTMLButtonElement, CategoryButtonProps>(
  (
    { category, open, isLoading, ...props }: ButtonProps & CategoryButtonProps,
    ref,
  ) => {
    const iconClassName = 'ml-2 h-4 w-4 shrink-0 opacity-50'
    return (
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="flex w-full justify-between border bg-background"
        ref={ref}
        {...props}
      >
        <CategoryLabel category={category} />
        {isLoading ? (
          <Loader2 className={`animate-spin ${iconClassName}`} />
        ) : (
          <ChevronDown className={iconClassName} />
        )}
      </Button>
    )
  },
)
CategoryButton.displayName = 'CategoryButton'

function CategoryLabel({ category }: { category: Category }) {
  const t = useTranslations('Categories')
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center border bg-muted/20">
        <CategoryIcon category={category} className="h-4 w-4" />
      </div>
      {t(`${category.grouping}.${category.name}`)}
    </div>
  )
}
