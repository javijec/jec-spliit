import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card'

function ExampleHoverCard() {
  return (
    <HoverCard>
      <HoverCardTrigger
        delay={0}
        closeDelay={0}
        render={<button type="button">Open preview</button>}
      >
        Preview
      </HoverCardTrigger>
      <HoverCardContent align="end">Protected participant</HoverCardContent>
    </HoverCard>
  )
}

describe('HoverCard', () => {
  it('opens from pointer hover and closes when the pointer leaves', async () => {
    render(<ExampleHoverCard />)
    const trigger = screen.getByRole('button', { name: 'Open preview' })

    fireEvent.mouseEnter(trigger)
    expect(await screen.findByText('Protected participant')).toBeTruthy()

    fireEvent.mouseLeave(trigger)
    await waitFor(() =>
      expect(screen.queryByText('Protected participant')).toBeNull(),
    )
  })

  it('opens from keyboard focus and closes with Escape', async () => {
    render(<ExampleHoverCard />)
    const trigger = screen.getByRole('button', { name: 'Open preview' })

    fireEvent.focus(trigger)
    expect(await screen.findByText('Protected participant')).toBeTruthy()

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })
    await waitFor(() =>
      expect(screen.queryByText('Protected participant')).toBeNull(),
    )
  })
})
