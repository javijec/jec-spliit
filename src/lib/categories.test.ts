import {
  getCategoryLabel,
  getCategoryTranslationKey,
  sortCategories,
} from './categories'

const translate = (key: string) => `translated:${key}`

describe('category presentation helpers', () => {
  it('translates built-in categories without changing their persisted identity', () => {
    const category = { id: 8, grouping: 'Food and Drink', name: 'Dining Out' }

    expect(getCategoryTranslationKey(category)).toBe(
      'Food and Drink.Dining Out',
    )
    expect(getCategoryLabel(category, translate)).toBe(
      'translated:Food and Drink.Dining Out',
    )
  })

  it('maps the empty category to the existing General category', () => {
    expect(getCategoryTranslationKey(null)).toBe('Uncategorized.General')
    expect(getCategoryLabel(null, translate)).toBe(
      'translated:Uncategorized.General',
    )
    expect(
      getCategoryLabel(
        { id: 0, grouping: 'legacy', name: 'ignored' },
        translate,
      ),
    ).toBe('translated:Uncategorized.General')
  })

  it('keeps unknown legacy and custom names as a safe fallback', () => {
    expect(
      getCategoryLabel(
        { id: 999, grouping: 'Legacy', name: 'Trip extras' },
        translate,
      ),
    ).toBe('Trip extras')
    expect(
      getCategoryLabel({ id: 999, grouping: 'Legacy', name: '  ' }, translate),
    ).toBe('translated:Uncategorized.General')
  })

  it('falls back when a locale does not contain a built-in translation', () => {
    const translate = Object.assign((key: string) => `translated:${key}`, {
      has: () => false,
    })

    expect(
      getCategoryLabel(
        { id: 8, grouping: 'Food and Drink', name: 'Dining Out' },
        translate,
      ),
    ).toBe('Dining Out')
  })

  it('sorts categories by stable group and places General last', () => {
    const categories = [
      { id: 0, grouping: 'Uncategorized', name: 'General' },
      { id: 8, grouping: 'Food and Drink', name: 'Dining Out' },
      { id: 30, grouping: 'Transportation', name: 'Car' },
      { id: 7, grouping: 'Food and Drink', name: 'Food and Drink' },
    ]

    expect(sortCategories(categories).map(({ id }) => id)).toEqual([
      8, 7, 30, 0,
    ])
    expect(categories[0]?.id).toBe(0)
  })
})
