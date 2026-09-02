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
    useTranslations: () => (key: string) => localeMessages.Groups[key] ?? key,
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

function renderCard(isStarred: boolean) {
  return render(
    <NextIntlClientProvider locale="en-US" messages={messages}>
      <RecentGroupListCard
        group={{ id: 'group-1', name: 'Trip' }}
        isStarred={isStarred}
        isArchived={false}
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
})
