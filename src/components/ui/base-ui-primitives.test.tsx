import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import * as React from 'react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

describe('Base UI low-risk primitives', () => {
  it('opens and closes a collapsible through its trigger', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>More options</CollapsibleTrigger>
        <CollapsibleContent>Advanced options</CollapsibleContent>
      </Collapsible>,
    )

    const trigger = screen.getByRole('button', { name: 'More options' })
    expect(screen.queryByText('Advanced options')).toBeNull()

    fireEvent.click(trigger)
    expect(screen.getByText('Advanced options')).toBeTruthy()
    expect(trigger.getAttribute('aria-expanded')).toBe('true')

    fireEvent.click(trigger)
    expect(screen.queryByText('Advanced options')).toBeNull()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('supports controlled collapsible state and asChild composition', () => {
    function ControlledCollapsible() {
      const [open, setOpen] = React.useState(false)

      return (
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <button type="button">Toggle details</button>
          </CollapsibleTrigger>
          <CollapsibleContent>Controlled details</CollapsibleContent>
        </Collapsible>
      )
    }

    render(<ControlledCollapsible />)
    const trigger = screen.getByRole('button', { name: 'Toggle details' })

    fireEvent.click(trigger)
    expect(screen.getByText('Controlled details')).toBeTruthy()
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
  })

  it('opens a popover, closes with Escape, and returns focus to its trigger', async () => {
    render(
      <Popover>
        <PopoverTrigger asChild>
          <button type="button">Share group</button>
        </PopoverTrigger>
        <PopoverContent>
          <button type="button">Copy link</button>
        </PopoverContent>
      </Popover>,
    )

    const trigger = screen.getByRole('button', { name: 'Share group' })
    fireEvent.click(trigger)

    expect(await screen.findByRole('dialog')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeTruthy()

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
    expect(document.activeElement).toBe(trigger)
  })

  it('opens a tooltip from keyboard focus with an accessible relationship', async () => {
    render(
      <TooltipProvider delay={0}>
        <Tooltip>
          <TooltipTrigger aria-label="More information">
            More information
          </TooltipTrigger>
          <TooltipContent>Additional context</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    )

    const trigger = screen.getByRole('button', { name: 'More information' })
    fireEvent.focus(trigger)

    expect(
      await screen.findByRole('tooltip', { name: 'Additional context' }),
    ).toBeTruthy()
  })
})
