import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import * as React from 'react'

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from './drawer'

function ExampleDrawer() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button type="button">Open details</button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerTitle>Details</DrawerTitle>
        <DrawerDescription>Useful details.</DrawerDescription>
        <DrawerClose>Dismiss</DrawerClose>
      </DrawerContent>
    </Drawer>
  )
}

describe('Drawer', () => {
  it('opens with an accessible title and description', async () => {
    render(<ExampleDrawer />)

    fireEvent.click(screen.getByRole('button', { name: 'Open details' }))

    const drawer = await screen.findByRole('dialog', { name: 'Details' })
    expect(drawer.getAttribute('aria-describedby')).not.toBeNull()
    expect(screen.getByText('Useful details.')).toBeTruthy()
    expect(drawer.className).toContain('max-h-[min(85dvh,42rem)]')
  })

  it('closes through Close and returns focus to an asChild trigger', async () => {
    render(<ExampleDrawer />)

    const trigger = screen.getByRole('button', { name: 'Open details' })
    fireEvent.click(trigger)
    fireEvent.click(await screen.findByRole('button', { name: 'Dismiss' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
    expect(document.activeElement).toBe(trigger)
  })

  it('closes with Escape and backdrop press', async () => {
    render(<ExampleDrawer />)

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
    function ControlledDrawer() {
      const [open, setOpen] = React.useState(false)

      return (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger>Open controlled</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Controlled details</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )
    }

    render(<ControlledDrawer />)
    fireEvent.click(screen.getByRole('button', { name: 'Open controlled' }))

    expect(await screen.findByRole('dialog', { name: 'Controlled details' })).toBeTruthy()

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
  })
})
