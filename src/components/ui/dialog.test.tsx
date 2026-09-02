import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import * as React from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from './dialog'

describe('Dialog', () => {
  it('opens from its trigger with accessible title and description', async () => {
    render(
      <Dialog>
        <DialogTrigger>Open details</DialogTrigger>
        <DialogContent>
          <DialogTitle>Details</DialogTitle>
          <DialogDescription>Useful details.</DialogDescription>
        </DialogContent>
      </Dialog>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open details' }))

    const dialog = await screen.findByRole('dialog', { name: 'Details' })
    expect(dialog.getAttribute('aria-describedby')).not.toBeNull()
    expect(screen.getByText('Useful details.')).toBeTruthy()
  })

  it('closes through Close and returns focus to the trigger', async () => {
    render(
      <Dialog>
        <DialogTrigger>Open details</DialogTrigger>
        <DialogContent>
          <DialogTitle>Details</DialogTitle>
          <DialogClose>Dismiss</DialogClose>
        </DialogContent>
      </Dialog>,
    )

    const trigger = screen.getByRole('button', { name: 'Open details' })
    fireEvent.click(trigger)
    fireEvent.click(await screen.findByRole('button', { name: 'Dismiss' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
    expect(document.activeElement).toBe(trigger)
  })

  it('closes with Escape and outside press', async () => {
    render(
      <Dialog>
        <DialogTrigger>Open details</DialogTrigger>
        <DialogContent>
          <DialogTitle>Details</DialogTitle>
        </DialogContent>
      </Dialog>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open details' }))
    expect(await screen.findByRole('dialog')).toBeTruthy()

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Open details' }))
    expect(await screen.findByRole('dialog')).toBeTruthy()
    const backdrop = document.querySelector('[data-open][role="presentation"]')

    expect(backdrop).toBeTruthy()
    fireEvent.click(backdrop as Element)

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
  })

  it('supports controlled open state', async () => {
    function ControlledDialog() {
      const [open, setOpen] = React.useState(false)

      return (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>Open controlled</DialogTrigger>
          <DialogContent>
            <DialogTitle>Controlled details</DialogTitle>
          </DialogContent>
        </Dialog>
      )
    }

    render(<ControlledDialog />)
    fireEvent.click(screen.getByRole('button', { name: 'Open controlled' }))

    expect(await screen.findByRole('dialog', { name: 'Controlled details' })).toBeTruthy()

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
  })
})
