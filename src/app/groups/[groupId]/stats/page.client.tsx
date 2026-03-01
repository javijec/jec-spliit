import { Totals } from '@/app/groups/[groupId]/stats/totals'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useTranslations } from 'next-intl'

export function TotalsPageClient() {
  const t = useTranslations('Stats')

  return (
    <>
      <Card className="mb-4 rounded-none -mx-4 border-x-0 sm:border-x sm:rounded-lg sm:mx-0 overflow-hidden">
        <CardHeader className="p-3 sm:p-6 border-b">
          <CardTitle className="text-xl leading-none">
            {t('Totals.title')}
          </CardTitle>
          <CardDescription className="mt-1.5 sm:mt-2">
            {t('Totals.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <Totals />
        </CardContent>
      </Card>
    </>
  )
}
