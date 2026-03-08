import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  FolderKanban,
  HandCoins,
  ReceiptText,
  Smartphone,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

export default function HomePage() {
  const t = useTranslations()
  return (
    <main className="px-4 pb-4 pt-4 sm:px-6 sm:pb-8 sm:pt-8">
      <section className="mx-auto grid w-full max-w-screen-xl gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.85fr)] lg:gap-10">
        <div className="border-b border-border pb-6 sm:pb-8 lg:pb-10">
          <div className="max-w-3xl space-y-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FolderKanban className="h-4 w-4 text-primary" />
              <span>{t('Layout.groupsCta')}</span>
            </div>
            <h1 className="landing-header max-w-2xl text-4xl font-semibold leading-[1.02] sm:text-5xl lg:text-6xl">
              {t.rich('Homepage.title', {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
              {t.rich('Homepage.description', {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild className="sm:min-w-44">
                <Link href="/groups">
                  {t('Homepage.button.groups')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="sm:min-w-40">
                <Link href="/groups/create">{t('Homepage.secondaryCta')}</Link>
              </Button>
            </div>
          </div>
        </div>

        <aside className="border border-border bg-card">
          <div className="border-b px-4 py-3 sm:px-5">
            <p className="text-sm font-medium text-foreground">
              {t('Homepage.button.groups')}
            </p>
          </div>
          <div className="grid gap-0">
            <FeatureRow
              icon={Smartphone}
              title={t('Homepage.features.simpleFlow.title')}
              description={t('Homepage.features.simpleFlow.description')}
            />
            <FeatureRow
              icon={ReceiptText}
              title={t('Homepage.features.clearExpenses.title')}
              description={t('Homepage.features.clearExpenses.description')}
            />
            <FeatureRow
              icon={HandCoins}
              title={t('Homepage.features.fastBalances.title')}
              description={t('Homepage.features.fastBalances.description')}
              last
            />
          </div>
        </aside>
      </section>
    </main>
  )
}

function FeatureRow({
  icon: Icon,
  title,
  description,
  last = false,
}: {
  icon: typeof Smartphone
  title: string
  description: string
  last?: boolean
}) {
  return (
    <div className={`px-4 py-4 sm:px-5 ${last ? '' : 'border-b'}`}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-medium text-foreground sm:text-base">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  )
}
