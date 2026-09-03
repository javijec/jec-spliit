import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import type { Currency } from '@/lib/currency'
import { useMediaQuery } from '@/lib/hooks'
import type { Category } from '@prisma/client'
import { CategorySelector } from './category-selector'
import { CurrencySelector } from './currency-selector'

jest.mock('@/lib/hooks', () => ({
  useMediaQuery: jest.fn(),
}))

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

jest.mock('@/app/groups/[groupId]/expenses/category-icon', () => ({
  CategoryIcon: () => <svg aria-hidden="true" />,
}))

const mockedUseMediaQuery = useMediaQuery as unknown as {
  mockReturnValue: (value: boolean) => void
}

const categories = [
  {
    id: 1,
    grouping: 'food',
    name: 'restaurant',
  },
  {
    id: 2,
    grouping: 'travel',
    name: 'transport',
  },
] as unknown as Category[]

const currencies: Currency[] = [
  {
    name: 'Argentine Peso',
    symbol_native: '$',
    symbol: '$',
    code: 'ARS',
    name_plural: 'Argentine pesos',
    rounding: 0,
    decimal_digits: 2,
  },
  {
    name: 'Euro',
    symbol_native: '€',
    symbol: '€',
    code: 'EUR',
    name_plural: 'euros',
    rounding: 0,
    decimal_digits: 2,
  },
]

describe('mobile Drawer consumers', () => {
  beforeEach(() => {
    mockedUseMediaQuery.mockReturnValue(false)
  })

  it('opens CategorySelector in a Drawer and selects an item', async () => {
    const onValueChange = jest.fn()

    render(
      <CategorySelector
        categories={categories}
        defaultValue={1}
        isLoading={false}
        onValueChange={onValueChange}
      />,
    )

    fireEvent.click(screen.getByRole('combobox'))

    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy())
    expect(screen.getByPlaceholderText('search')).toBeTruthy()

    fireEvent.click(screen.getByRole('option', { name: 'transport' }))

    await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith(2))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('opens CurrencySelector in a named Drawer and selects an item', async () => {
    const onValueChange = jest.fn()

    render(
      <CurrencySelector
        currencies={currencies}
        defaultValue="ARS"
        isLoading={false}
        onValueChange={onValueChange}
      />,
    )

    fireEvent.click(screen.getByRole('combobox'))

    const dialog = await screen.findByRole('dialog', {
      name: 'Select currency',
    })
    expect(dialog).toBeTruthy()
    expect(screen.getByPlaceholderText('search')).toBeTruthy()

    fireEvent.click(screen.getByRole('option', { name: /euro/i }))

    await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith('EUR'))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
