import { Button } from '@/components/ui/button'
import { ArrowRight, HandCoins, ReceiptText, Smartphone } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

// FIX for https://github.com/vercel/next.js/issues/58615
// export const dynamic = 'force-dynamic'

export default function HomePage() {
  const t = useTranslations()
  return (
    <main className="relative flex min-h-[calc(100dvh-18rem)] items-start px-4 pb-2 pt-3 sm:min-h-[calc(100dvh-4rem)] sm:items-center sm:px-6 sm:py-10">
      <section className="relative mx-auto w-full max-w-screen-md">
        <div className="rounded-[1.5rem] border bg-card p-4 shadow-sm sm:rounded-[1.75rem] sm:p-8">
          <div className="space-y-4 sm:space-y-5">
            <div className="space-y-2 sm:space-y-3">
              <h1 className="landing-header py-1 text-[2.35rem] font-bold leading-[0.92] sm:text-5xl">
                {t.rich('Homepage.title', {
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </h1>
              <p className="max-w-[36rem] text-[15px] leading-6 text-muted-foreground sm:text-lg">
                {t.rich('Homepage.description', {
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
            </div>

            <div className="grid gap-2 sm:flex sm:flex-wrap">
              <Button asChild className="h-10 w-full sm:h-11 sm:w-auto sm:min-w-44">
                <Link href="/groups">
                  {t('Homepage.button.groups')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-10 w-full sm:h-11 sm:w-auto"
              >
                <Link href="/groups/create">{t('Homepage.secondaryCta')}</Link>
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border bg-background p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                  <p className="text-[15px] font-medium sm:text-base">
                    {t('Homepage.features.simpleFlow.title')}
                  </p>
                </div>
                <p className="mt-1 text-[13px] leading-5 text-muted-foreground sm:text-sm sm:leading-6">
                  {t('Homepage.features.simpleFlow.description')}
                </p>
              </div>
              <div className="rounded-2xl border bg-background p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <ReceiptText className="h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                  <p className="text-[15px] font-medium sm:text-base">
                    {t('Homepage.features.clearExpenses.title')}
                  </p>
                </div>
                <p className="mt-1 text-[13px] leading-5 text-muted-foreground sm:text-sm sm:leading-6">
                  {t('Homepage.features.clearExpenses.description')}
                </p>
              </div>
              <div className="rounded-2xl border bg-background p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <HandCoins className="h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                  <p className="text-[15px] font-medium sm:text-base">
                    {t('Homepage.features.fastBalances.title')}
                  </p>
                </div>
                <p className="mt-1 text-[13px] leading-5 text-muted-foreground sm:text-sm sm:leading-6">
                  {t('Homepage.features.fastBalances.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
