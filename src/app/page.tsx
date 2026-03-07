import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, HandCoins, ReceiptText, Smartphone } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

// FIX for https://github.com/vercel/next.js/issues/58615
// export const dynamic = 'force-dynamic'

export default function HomePage() {
  const t = useTranslations()
  return (
    <main className="relative overflow-hidden px-4 py-6 sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-20 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-primary/70 blur-3xl" />
        <div className="absolute bottom-10 right-0 h-40 w-40 rounded-full bg-emerald-300/40 blur-3xl dark:bg-emerald-500/20" />
      </div>

      <section className="relative mx-auto w-full max-w-screen-md">
        <div className="rounded-[1.75rem] border bg-card/75 p-5 shadow-sm backdrop-blur-sm sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {t('Homepage.badges.mobileFirst')}
            </Badge>
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {t('Homepage.badges.multiCurrency')}
            </Badge>
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {t('Homepage.badges.partialPayments')}
            </Badge>
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {t('Homepage.badges.csvImport')}
            </Badge>
          </div>

          <div className="mt-5 space-y-5">
            <div className="space-y-3">
              <h1 className="landing-header py-1 text-4xl font-bold leading-none sm:text-5xl">
                {t.rich('Homepage.title', {
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </h1>
              <p className="max-w-[36rem] text-base leading-7 text-muted-foreground sm:text-lg">
                {t.rich('Homepage.description', {
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
            </div>

            <div className="grid gap-2 sm:flex sm:flex-wrap">
              <Button asChild size="lg" className="w-full sm:w-auto sm:min-w-44">
                <Link href="/groups">
                  {t('Homepage.button.groups')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Link href="/groups/create">{t('Homepage.secondaryCta')}</Link>
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border bg-background/70 p-4">
                <Smartphone className="h-5 w-5 text-primary" />
                <p className="mt-3 font-medium">
                  {t('Homepage.features.simpleFlow.title')}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('Homepage.features.simpleFlow.description')}
                </p>
              </div>
              <div className="rounded-2xl border bg-background/70 p-4">
                <ReceiptText className="h-5 w-5 text-primary" />
                <p className="mt-3 font-medium">
                  {t('Homepage.features.clearExpenses.title')}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('Homepage.features.clearExpenses.description')}
                </p>
              </div>
              <div className="rounded-2xl border bg-background/70 p-4">
                <HandCoins className="h-5 w-5 text-primary" />
                <p className="mt-3 font-medium">
                  {t('Homepage.features.fastBalances.title')}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
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
