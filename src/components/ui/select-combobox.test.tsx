import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import * as React from 'react'
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from './combobox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'

describe('Select', () => {
  it('opens, selects an option, and returns focus to the trigger', async () => {
    render(
      <Select
        defaultValue="ars"
        items={[
          { value: 'ars', label: 'ARS' },
          { value: 'usd', label: 'USD' },
        ]}
      >
        <SelectTrigger aria-label="Currency">
          <SelectValue placeholder="Select currency" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ars">ARS</SelectItem>
          <SelectItem value="usd">USD</SelectItem>
        </SelectContent>
      </Select>,
    )

    const trigger = screen.getByRole('combobox', { name: 'Currency' })
    expect(trigger.textContent).toContain('ARS')

    fireEvent.click(trigger)
    expect(await screen.findByRole('listbox')).toBeTruthy()
    const usdOption = screen.getByRole('option', { name: 'USD' })
    fireEvent.pointerDown(usdOption, { button: 0, pointerId: 1, pointerType: 'mouse' })
    fireEvent.click(usdOption)

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).toBeNull()
    })
    expect(trigger.textContent).toContain('USD')
    expect(document.activeElement).toBe(trigger)
  })

  it('supports controlled values and keeps disabled options inert', async () => {
    function ControlledSelect() {
      const [value, setValue] = React.useState('ars')

      return (
        <Select
          value={value}
          onValueChange={(nextValue) => {
            if (nextValue) setValue(nextValue)
          }}
          items={[
            { value: 'ars', label: 'ARS' },
            { value: 'usd', label: 'USD' },
          ]}
        >
          <SelectTrigger aria-label="Currency">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ars">ARS</SelectItem>
            <SelectItem value="usd" disabled>
              USD
            </SelectItem>
          </SelectContent>
        </Select>
      )
    }

    render(<ControlledSelect />)
    const trigger = screen.getByRole('combobox', { name: 'Currency' })
    fireEvent.keyDown(trigger, { key: 'ArrowDown', code: 'ArrowDown' })

    const disabledOption = await screen.findByRole('option', { name: 'USD' })
    expect(disabledOption.getAttribute('aria-disabled')).toBe('true')
    fireEvent.click(disabledOption)
    expect(trigger.textContent).toContain('ARS')

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).toBeNull()
    })
  })
})

describe('Combobox', () => {
  it('filters items, selects a result, and handles no-results and Escape', async () => {
    function FruitCombobox() {
      const [open, setOpen] = React.useState(true)
      const [value, setValue] = React.useState<string | null>(null)
      const [escaped, setEscaped] = React.useState(false)

      return (
        <div
          onKeyDown={(event) => {
            if (event.key === 'Escape') setEscaped(true)
          }}
        >
          <Combobox
            items={['Apple', 'Banana']}
            inline
            open={open}
            onOpenChange={setOpen}
            value={value}
            onValueChange={setValue}
          >
            <ComboboxInput aria-label="Fruit" placeholder="Search fruit" />
            <ComboboxEmpty>No results</ComboboxEmpty>
            <ComboboxList>
              {(fruit) => (
                <ComboboxItem key={fruit} value={fruit}>
                  {fruit}
                </ComboboxItem>
              )}
            </ComboboxList>
            <output>{value}</output>
          </Combobox>
          <output data-testid="escaped">{String(escaped)}</output>
        </div>
      )
    }

    render(<FruitCombobox />)
    const input = screen.getByRole('combobox', { name: 'Fruit' })

    fireEvent.change(input, { target: { value: 'app' } })
    await waitFor(() => {
      expect(screen.queryByRole('option', { name: 'Apple' })).toBeTruthy()
      expect(screen.queryByRole('option', { name: 'Banana' })).toBeNull()
    })

    fireEvent.click(screen.getByRole('option', { name: 'Apple' }))
    expect(screen.getByText('Apple', { selector: 'output' })).toBeTruthy()
    expect(
      screen.getByRole('option', { name: 'Apple' }).getAttribute('aria-selected'),
    ).toBe('true')

    fireEvent.change(input, { target: { value: 'zzz' } })
    expect(await screen.findByText('No results')).toBeTruthy()

    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' })
    expect(screen.getByTestId('escaped').textContent).toBe('true')
    expect(screen.getByRole('listbox')).toBeTruthy()
  })
})
