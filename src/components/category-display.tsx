'use client'

import { CategoryIcon } from '@/app/groups/[groupId]/expenses/category-icon'
import { getCategoryLabel } from '@/lib/categories'
import type { Category } from '@prisma/client'
import { useTranslations } from 'next-intl'

export function CategoryName({
  category,
  className,
}: {
  category: Category | null | undefined
  className?: string
}) {
  const t = useTranslations('Categories')
  return <span className={className}>{getCategoryLabel(category, t)}</span>
}

export function CategoryDisplay({
  category,
  className,
}: {
  category: Category | null | undefined
  className?: string
}) {
  return (
    <span className={className}>
      <CategoryIcon
        category={category}
        className="h-4 w-4"
        aria-hidden="true"
      />
      <CategoryName category={category} />
    </span>
  )
}
