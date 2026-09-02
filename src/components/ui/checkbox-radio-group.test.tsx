import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import * as React from 'react'
import { Controller, useForm } from 'react-hook-form'

import { Checkbox } from '@/components/ui/checkbox'
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group'

beforeAll(() => {
  if (typeof window !== 'undefined' && typeof window.PointerEvent !== 'function') {
    Object.defineProperty(window, 'PointerEvent', {
      configurable: true,
      value: window.MouseEvent,
      writable: true,
    })
  }
})

describe('Checkbox', () => {
  it('toggles an uncontrolled checkbox', () => {
    render(<Checkbox aria-label="Accept terms" />)

    const checkbox = screen.getByRole('checkbox', { name: 'Accept terms' })
    expect(checkbox.getAttribute('aria-checked')).toBe('false')

    fireEvent.click(checkbox)
    expect(checkbox.getAttribute('aria-checked')).toBe('true')

    fireEvent.click(checkbox)
    expect(checkbox.getAttribute('aria-checked')).toBe('false')
  })

  it('updates a controlled checkbox through onCheckedChange', () => {
    function ControlledCheckbox() {
      const [checked, setChecked] = React.useState(false)

      return (
        <Checkbox
          aria-label="Receive updates"
          checked={checked}
          onCheckedChange={setChecked}
        />
      )
    }

    render(<ControlledCheckbox />)

    const checkbox = screen.getByRole('checkbox', { name: 'Receive updates' })
    fireEvent.click(checkbox)

    expect(checkbox.getAttribute('aria-checked')).toBe('true')
  })

  it('does not toggle when disabled', () => {
    render(<Checkbox aria-label="Unavailable option" disabled />)

    const checkbox = screen.getByRole('checkbox', {
      name: 'Unavailable option',
    })
    fireEvent.click(checkbox)

    expect(checkbox.hasAttribute('disabled')).toBe(true)
    expect(checkbox.getAttribute('aria-checked')).toBe('false')
  })

  it('exposes an indeterminate state and keeps it out of form submission', () => {
    render(
      <form aria-label="Preferences">
        <Checkbox
          aria-label="Partial preference"
          checked={false}
          indeterminate
          name="preference"
          value="enabled"
        />
      </form>,
    )

    const checkbox = screen.getByRole('checkbox', {
      name: 'Partial preference',
    })
    const input = document.querySelector(
      'input[type="checkbox"][name="preference"]',
    ) as HTMLInputElement

    expect(checkbox.getAttribute('aria-checked')).toBe('mixed')
    expect(input).toBeTruthy()
    expect(input.indeterminate).toBe(true)
    expect(new FormData(input.form ?? undefined).has('preference')).toBe(false)
  })

  it('submits a checked value through the local React Hook Form adapter', async () => {
    const submitted: Array<{ enabled: boolean }> = []

    function HookFormCheckbox() {
      const form = useForm({
        defaultValues: { enabled: false },
      })

      return (
        <form onSubmit={form.handleSubmit((values) => submitted.push(values))}>
            <Controller
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <Checkbox
                  aria-label="Enable integration"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <button type="submit">Submit preferences</button>
        </form>
      )
    }

    render(<HookFormCheckbox />)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Enable integration' }))
    fireEvent.submit(screen.getByRole('button', { name: 'Submit preferences' }))

    await waitFor(() => {
      expect(submitted).toEqual([{ enabled: true }])
    })
  })
})

describe('Radio Group', () => {
  function ExampleRadioGroup(
    props: React.ComponentProps<typeof RadioGroup> = {},
  ) {
    return (
      <RadioGroup aria-label="Notification frequency" {...props}>
        <RadioGroupItem aria-label="Never" value="never" />
        <RadioGroupItem aria-label="Daily" value="daily" />
        <RadioGroupItem aria-label="Weekly" value="weekly" />
      </RadioGroup>
    )
  }

  it('selects an item and keeps exactly one item selected', () => {
    render(<ExampleRadioGroup />)

    const daily = screen.getByRole('radio', { name: 'Daily' })
    fireEvent.click(daily)

    const selected = screen
      .getAllByRole('radio')
      .filter((radio) => radio.getAttribute('aria-checked') === 'true')

    expect(daily.getAttribute('aria-checked')).toBe('true')
    expect(selected).toHaveLength(1)
  })

  it('updates a controlled value through onValueChange', () => {
    function ControlledRadioGroup() {
      const [value, setValue] = React.useState('never')

      return (
        <ExampleRadioGroup value={value} onValueChange={setValue} />
      )
    }

    render(<ControlledRadioGroup />)
    fireEvent.click(screen.getByRole('radio', { name: 'Weekly' }))

    expect(
      screen.getByRole('radio', { name: 'Never' }).getAttribute('aria-checked'),
    ).toBe('false')
    expect(
      screen
        .getByRole('radio', { name: 'Weekly' })
        .getAttribute('aria-checked'),
    ).toBe('true')
  })

  it('does not select a disabled item', () => {
    render(
      <RadioGroup aria-label="Disabled choices">
        <RadioGroupItem aria-label="Available" value="available" />
        <RadioGroupItem
          aria-label="Unavailable"
          disabled
          value="unavailable"
        />
      </RadioGroup>,
    )

    const unavailable = screen.getByRole('radio', { name: 'Unavailable' })
    fireEvent.click(unavailable)

    expect(unavailable.hasAttribute('disabled')).toBe(true)
    expect(unavailable.getAttribute('aria-checked')).toBe('false')
  })

  it('moves selection with arrow keys when jsdom supports roving focus', async () => {
    render(<ExampleRadioGroup defaultValue="never" />)

    const never = screen.getByRole('radio', { name: 'Never' })
    const daily = screen.getByRole('radio', { name: 'Daily' })
    never.focus()

    fireEvent.keyDown(never, { key: 'ArrowDown', code: 'ArrowDown' })

    await waitFor(() => {
      expect(document.activeElement).toBe(daily)
      expect(daily.getAttribute('aria-checked')).toBe('true')
      expect(never.getAttribute('aria-checked')).toBe('false')
    })
  })
})
