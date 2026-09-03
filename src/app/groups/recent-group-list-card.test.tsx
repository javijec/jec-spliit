import { AppRouterOutput } from '@/trpc/routers/_app'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import messages from '../../../messages/en-US.json'
import { RecentGroupListCard } from './recent-group-list-card'

jest.mock('next-intl', () => {
  const localeMessages = require('../../../messages/en-US.json')

  return {
    NextIntlClientProvider: ({ children }: { children: React.ReactNode }) =>
      children,
    useLocale: () => 'en-US',
    useTranslations: () => (key: string, values?: { count?: number }) => {
      const message = localeMessages.Groups[key] ?? key
      return values?.count === undefined
        ? message
        : message.replace('{count}', String(values.count))
    },
  }
})

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, ...props }: React.ComponentProps<'a'>) => (
    <a {...props}>{children}</a>
  ),
}))

const groupDetail = {
  id: 'group-1',
  name: 'Trip',
  currency: '$',
  currencyCode: 'USD',
  createdAt: '2026-08-20T10:00:00.000Z',
  information: null,
  defaultSplitMode: 'EVENLY',
  defaultSplitShares: [],
  _count: { participants: 4 },
  isArchived: false,
  isStarred: false,
  lastAccessedAt: '2026-08-20T10:00:00.000Z',
  totalSpentByCurrency: { USD: 294640 },
  personalBalanceByCurrency: { USD: 18320 },
  lastActivityAt: '2026-08-31T18:30:00.000Z',
} as AppRouterOutput['groups']['mine']['groups'][number]

function renderCard(
  isStarred: boolean,
  detail?: AppRouterOutput['groups']['mine']['groups'][number],
  isArchived = false,
) {
  return render(
    <NextIntlClientProvider locale="en-US" messages={messages}>
      <RecentGroupListCard
        group={{ id: 'group-1', name: 'Trip' }}
        groupDetail={detail}
        isStarred={isStarred}
        isArchived={isArchived}
        refreshGroupsFromStorage={jest.fn()}
      />
    </NextIntlClientProvider>,
  )
}

describe('RecentGroupListCard favorite accessibility label', () => {
  it('announces the action to add an unstarred group to favorites', () => {
    renderCard(false)

    expect(
      screen.getByRole('button', { name: messages.Groups.addToFavorites }),
    ).toBeTruthy()
  })

  it('announces the action to remove a starred group from favorites', () => {
    renderCard(true)

    expect(
      screen.getByRole('button', {
        name: messages.Groups.removeFromFavorites,
      }),
    ).toBeTruthy()
  })

  it('shows participant count, last activity, and a positive balance', () => {
    renderCard(false, groupDetail)

    expect(screen.getByText('4 participants')).toBeTruthy()
    expect(screen.getByText(/Last activity:/)).toBeTruthy()
    expect(screen.getByText('Total spent:')).toBeTruthy()
    expect(screen.getByText('You are owed:')).toBeTruthy()
  })

  it('shows a negative balance without combining currencies', () => {
    renderCard(false, {
      ...groupDetail,
      totalSpentByCurrency: { ARS: 294640, USD: 2000 },
      personalBalanceByCurrency: { ARS: 18320, USD: -1174 },
    })

    expect(screen.getByText('You are owed:')).toBeTruthy()
    expect(screen.getByText('You owe:')).toBeTruthy()
  })

  it('shows the settled state and archived state', () => {
    renderCard(
      false,
      {
        ...groupDetail,
        personalBalanceByCurrency: { USD: 0 },
      },
      true,
    )

    expect(screen.getByText('All even')).toBeTruthy()
    expect(screen.getByText('Archived groups')).toBeTruthy()
  })
})
