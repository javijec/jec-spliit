import { Locale } from '@/i18n/request'
import currencyList from './currency-data.json'

export type Currency = {
  name: string
  symbol_native: string
  symbol: string
  code: string
  name_plural: string
  rounding: number
  decimal_digits: number
}

export const supportedCurrencyCodes = [
  'ARS',
  'USD',
  'EUR',
  'JPY',
  'BGN',
  'CZK',
  'DKK',
  'GBP',
  'HUF',
  'PLN',
  'RON',
  'SEK',
  'CHF',
  'ISK',
  'NOK',
  'TRY',
  'AUD',
  'BRL',
  'CAD',
  'CNY',
  'HKD',
  'IDR',
  'ILS',
  'INR',
  'KRW',
  'MXN',
  'NZD',
  'PHP',
  'SGD',
  'THB',
  'ZAR',
] as const
export type supportedCurrencyCodeType = (typeof supportedCurrencyCodes)[number]

export function defaultCurrencyList(
  locale: Locale = 'en-US',
  customChoice: string | null = null,
) {
  const currencies = customChoice
    ? [
        {
          name: customChoice,
          symbol_native: '',
          symbol: '',
          code: '',
          name_plural: customChoice,
          rounding: 0,
          decimal_digits: 2,
        },
      ]
    : []
  const allCurrencies = currencyList[locale] ?? currencyList['en-US']
  const currenciesByCode = Object.values(allCurrencies).reduce<
    Record<string, Currency>
  >((acc, currency) => {
    acc[currency.code] = currency
    return acc
  }, {})

  const topPriorityCodes = ['ARS', 'USD', 'EUR']
  const latinAmericaCodes = [
    'COP',
    'MXN',
    'BRL',
    'CLP',
    'PEN',
    'UYU',
    'PYG',
    'BOB',
    'VES',
    'DOP',
    'CRC',
    'GTQ',
    'HNL',
    'NIO',
    'PAB',
  ]

  const usedCodes = new Set<string>()
  const orderedCurrencies = [...topPriorityCodes, ...latinAmericaCodes]
    .map((code) => currenciesByCode[code])
    .filter((currency): currency is Currency => !!currency)
    .filter((currency) => {
      if (usedCodes.has(currency.code)) return false
      usedCodes.add(currency.code)
      return true
    })

  const remainingCurrencies = Object.values(allCurrencies)
    .filter((currency) => !usedCodes.has(currency.code))
    .sort((a, b) => a.name.localeCompare(b.name, locale))

  return currencies.concat(orderedCurrencies, remainingCurrencies)
}

export function getCurrency(
  currencyCode: string | undefined | null,
  locale: Locale = 'en-US',
  customChoice = 'Custom',
): Currency {
  const defaultCurrency = {
    name: customChoice,
    symbol_native: '',
    symbol: '',
    code: '',
    name_plural: customChoice,
    rounding: 0,
    decimal_digits: 2,
  }
  if (!currencyCode || currencyCode === '') return defaultCurrency
  const currencyListInLocale = currencyList[locale] ?? currencyList['en-US']
  return (
    currencyListInLocale[currencyCode as supportedCurrencyCodeType] ??
    defaultCurrency
  )
}
