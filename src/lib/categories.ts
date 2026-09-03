import type { Category } from '@prisma/client'

export type CategoryLike = Pick<Category, 'id' | 'grouping' | 'name'>
export type CategoryTranslator = ((key: string) => string) & {
  has?: (key: string) => boolean
}

const CATEGORY_GROUP_ORDER = [
  'Food and Drink',
  'Transportation',
  'Entertainment',
  'Home',
  'Life',
  'Utilities',
  'Uncategorized',
] as const

const BUILT_IN_CATEGORY_KEYS = new Set([
  'Uncategorized/General',
  'Uncategorized/Payment',
  'Entertainment/Entertainment',
  'Entertainment/Games',
  'Entertainment/Movies',
  'Entertainment/Music',
  'Entertainment/Sports',
  'Food and Drink/Food and Drink',
  'Food and Drink/Dining Out',
  'Food and Drink/Groceries',
  'Food and Drink/Liquor',
  'Home/Home',
  'Home/Electronics',
  'Home/Furniture',
  'Home/Household Supplies',
  'Home/Maintenance',
  'Home/Mortgage',
  'Home/Pets',
  'Home/Rent',
  'Home/Services',
  'Life/Childcare',
  'Life/Clothing',
  'Life/Donation',
  'Life/Education',
  'Life/Gifts',
  'Life/Insurance',
  'Life/Medical Expenses',
  'Life/Taxes',
  'Transportation/Transportation',
  'Transportation/Bicycle',
  'Transportation/Bus/Train',
  'Transportation/Car',
  'Transportation/Gas/Fuel',
  'Transportation/Hotel',
  'Transportation/Parking',
  'Transportation/Plane',
  'Transportation/Taxi',
  'Utilities/Utilities',
  'Utilities/Cleaning',
  'Utilities/Electricity',
  'Utilities/Heat/Gas',
  'Utilities/Trash',
  'Utilities/TV/Phone/Internet',
  'Utilities/Water',
])

function categoryKey(category: CategoryLike | null | undefined) {
  return category ? `${category.grouping}/${category.name}` : ''
}

function categoryTranslationKey(category: CategoryLike) {
  return `${category.grouping}.${category.name}`
}

function categoryGroupRank(grouping: string) {
  const index = CATEGORY_GROUP_ORDER.indexOf(
    grouping as (typeof CATEGORY_GROUP_ORDER)[number],
  )
  return index === -1 ? CATEGORY_GROUP_ORDER.length : index
}

function categoryNameRank(category: CategoryLike) {
  if (category.grouping !== 'Uncategorized') return 0
  if (category.name === 'Payment') return 1
  if (category.name === 'General') return 2
  return 0
}

export function sortCategories<T extends CategoryLike>(categories: T[]) {
  return [...categories].sort((left, right) => {
    const groupOrder =
      categoryGroupRank(left.grouping) - categoryGroupRank(right.grouping)
    if (groupOrder !== 0) return groupOrder

    const nameOrder = categoryNameRank(left) - categoryNameRank(right)
    if (nameOrder !== 0) return nameOrder

    return left.name.localeCompare(right.name)
  })
}

export function getCategoryTranslationKey(
  category: CategoryLike | null | undefined,
) {
  if (!category || category.id === 0) return 'Uncategorized.General'
  return categoryTranslationKey(category)
}

export function getCategoryLabel(
  category: CategoryLike | null | undefined,
  translate?: CategoryTranslator,
) {
  if (!category || category.id === 0) {
    return translateCategoryKey(translate, 'Uncategorized.General', 'General')
  }

  const lookupKey = categoryKey(category)
  if (BUILT_IN_CATEGORY_KEYS.has(lookupKey)) {
    return translateCategoryKey(
      translate,
      getCategoryTranslationKey(category),
      category.name,
    )
  }

  const name = category?.name?.trim()
  return (
    name || translateCategoryKey(translate, 'Uncategorized.General', 'General')
  )
}

export function getCategoryGroupLabel(
  grouping: string,
  translate?: CategoryTranslator,
) {
  return translateCategoryKey(translate, `${grouping}.heading`, grouping)
}

function translateCategoryKey(
  translate: CategoryTranslator | undefined,
  key: string,
  fallback: string,
) {
  if (!translate || (translate.has && !translate.has(key))) return fallback
  return translate(key)
}
