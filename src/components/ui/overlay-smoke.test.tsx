import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

describe('overlay contracts', () => {
  it('opens a dialog, closes with Escape, and returns focus to its trigger', async () => {
    render(
      <Dialog>
        <DialogTrigger>Open details</DialogTrigger>
        <DialogContent>
          <DialogTitle>Details</DialogTitle>
          <p>Dialog content</p>
        </DialogContent>
      </Dialog>,
    )

    const trigger = screen.getByRole('button', { name: 'Open details' })
    fireEvent.click(trigger)

    expect(await screen.findByRole('dialog')).toBeTruthy()

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
    expect(document.activeElement).toBe(trigger)
  })

  it('opens and closes a dropdown menu with Escape', async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Group actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Archive group</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    )

    const trigger = screen.getByRole('button', { name: 'Group actions' })
    fireEvent.pointerDown(trigger, { button: 0 })

    expect(await screen.findByRole('menu')).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Archive group' })).toBeTruthy()

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })

    await waitFor(() => {
      expect(screen.queryByRole('menu')).toBeNull()
    })
  })

  it('exposes Select options through the accessible listbox contract', async () => {
    render(
      <Select defaultValue="ars">
        <SelectTrigger aria-label="Currency">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ars">ARS</SelectItem>
          <SelectItem value="usd">USD</SelectItem>
        </SelectContent>
      </Select>,
    )

    fireEvent.pointerDown(screen.getByRole('combobox', { name: 'Currency' }), {
      button: 0,
    })

    expect(await screen.findByRole('listbox')).toBeTruthy()
    expect(screen.getByRole('option', { name: 'USD' })).toBeTruthy()
  })
})
