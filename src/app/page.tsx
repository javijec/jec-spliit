import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Github } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

// FIX for https://github.com/vercel/next.js/issues/58615
// export const dynamic = 'force-dynamic'

export default function HomePage() {
  const t = useTranslations()
  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute -top-20 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-primary blur-3xl" />
      </div>

      <section className="relative py-8 sm:py-14 md:py-20">
        <div className="mx-auto w-full max-w-screen-md px-4">
          <div className="rounded-2xl border bg-card/70 backdrop-blur-sm p-5 sm:p-8 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
              <Badge variant="secondary">Multi-moneda</Badge>
              <Badge variant="secondary">Pagos parciales</Badge>
              <Badge variant="secondary">Importación CSV</Badge>
            </div>

            <div className="flex flex-col items-center gap-4 text-center">
              <h1 className="!leading-none font-bold text-3xl sm:text-4xl md:text-5xl landing-header py-2">
                {t.rich('Homepage.title', {
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </h1>
              <p className="max-w-[42rem] leading-normal text-muted-foreground text-base sm:text-xl sm:leading-8">
                {t.rich('Homepage.description', {
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full sm:w-auto">
                <Button asChild size="lg" className="w-full sm:min-w-40">
                  <Link href="/groups">{t('Homepage.button.groups')}</Link>
                </Button>
                <Button
                  asChild
                  variant="secondary"
                  size="lg"
                  className="w-full sm:min-w-40"
                >
                  <Link href="https://github.com/javijec/jec-spliit">
                    <Github className="w-4 h-4 mr-2" />
                    {t('Homepage.button.github')}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
