import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

// FIX for https://github.com/vercel/next.js/issues/58615
// export const dynamic = 'force-dynamic'

export default function HomePage() {
  const t = useTranslations()
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="page-panel overflow-hidden">
        <div className="grid gap-8 px-5 py-8 md:px-8 md:py-10 xl:grid-cols-[minmax(0,1.2fr)_360px] xl:gap-10">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Mobile first</Badge>
              <Badge variant="secondary">Multi-moneda</Badge>
              <Badge variant="secondary">Liquidaciones claras</Badge>
            </div>

            <div className="space-y-4">
              <p className="hero-kicker">Expense cockpit</p>
              <h1 className="max-w-3xl text-balance text-4xl sm:text-5xl xl:text-6xl">
                {t.rich('Homepage.title', {
                  strong: (chunks) => <span className="text-primary">{chunks}</span>,
                })}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                {t.rich('Homepage.description', {
                  strong: (chunks) => <strong className="text-foreground">{chunks}</strong>,
                })}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-full px-6">
                <Link href="/groups">{t('Homepage.button.groups')}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-6">
                <Link href="/groups/create">Crear grupo</Link>
              </Button>
            </div>
          </div>

          <div className="page-panel-inset p-5 sm:p-6">
            <p className="hero-kicker">Flujo ideal</p>
            <div className="mt-4 space-y-4">
              <div className="rounded-[22px] border border-black/5 bg-background/80 p-4 dark:border-white/10">
                <p className="text-sm font-medium">1. Abrís un grupo</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Compartís el link y definís participantes en menos de un minuto.
                </p>
              </div>
              <div className="rounded-[22px] border border-black/5 bg-background/80 p-4 dark:border-white/10">
                <p className="text-sm font-medium">2. Cargás gastos rápido</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Monto, quién pagó y cómo se reparte. El resto debería ser opcional.
                </p>
              </div>
              <div className="rounded-[22px] border border-black/5 bg-background/80 p-4 dark:border-white/10">
                <p className="text-sm font-medium">3. Liquidás sin fricción</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  El grupo ve quién debe, cuánto y cuál es la mejor liquidación posible.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
