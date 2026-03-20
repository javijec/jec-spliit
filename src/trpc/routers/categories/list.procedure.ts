import { getCategories } from '@/lib/groups'
import { baseProcedure } from '@/trpc/init'

export const listCategoriesProcedure = baseProcedure.query(async () => {
  return { categories: await getCategories() }
})
