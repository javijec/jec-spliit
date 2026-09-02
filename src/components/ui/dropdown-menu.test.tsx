import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function openMenu() {
  const trigger = screen.getByRole('button', { name: 'Open menu' })
  fireEvent.click(trigger)
  return trigger
}

describe('DropdownMenu', () => {
  it('opens with keyboard, navigates items, closes with Escape, and returns focus', async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>First action</DropdownMenuItem>
          <DropdownMenuItem>Second action</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    )

    const trigger = screen.getByRole('button', { name: 'Open menu' })
    trigger.focus()
    // A native button turns Enter/Space into a click; detail=0 represents that
    // keyboard activation in jsdom without reimplementing Base UI navigation.
    fireEvent.click(trigger, { detail: 0 })

    const menu = await screen.findByRole('menu')
    const [firstItem, secondItem] = screen.getAllByRole('menuitem')
    expect(screen.getAllByRole('menuitem')).toHaveLength(2)
    expect(menu.getAttribute('data-open')).not.toBeNull()
    expect(document.activeElement).toBe(firstItem)

    fireEvent.keyDown(firstItem, { key: 'ArrowDown', code: 'ArrowDown' })
    expect(document.activeElement).toBe(secondItem)
    fireEvent.keyDown(secondItem, { key: 'Home', code: 'Home' })
    expect(document.activeElement).toBe(firstItem)
    fireEvent.keyDown(firstItem, { key: 'End', code: 'End' })
    expect(document.activeElement).toBe(secondItem)
    fireEvent.keyDown(secondItem, { key: 'ArrowUp', code: 'ArrowUp' })
    expect(document.activeElement).toBe(firstItem)
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })

    await waitFor(() => {
      expect(screen.queryByRole('menu')).toBeNull()
    })
    expect(document.activeElement).toBe(trigger)
  })

  it('calls item handlers and skips disabled items', async () => {
    const onClick = jest.fn()

    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem disabled onClick={onClick}>
            Disabled action
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onClick}>Enabled action</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    )

    openMenu()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Disabled action' }))
    expect(onClick).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('menuitem', { name: 'Enabled action' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('composes trigger and link items through the local asChild API', async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button">Open menu</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem asChild>
            <a href="/export">Export</a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    )

    const trigger = screen.getByRole('button', { name: 'Open menu' })
    fireEvent.mouseDown(trigger, { button: 0 })

    expect(await screen.findByRole('menuitem', { name: 'Export' })).toBeTruthy()
    expect(trigger.tagName).toBe('BUTTON')
  })

  it('supports controlled checkbox menu items', async () => {
    const onCheckedChange = jest.fn()

    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem
            checked={false}
            onCheckedChange={onCheckedChange}
          >
            Show sidebar
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    )

    openMenu()
    const item = screen.getByRole('menuitemcheckbox', { name: 'Show sidebar' })
    expect(item.getAttribute('aria-checked')).toBe('false')
    fireEvent.click(item)
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything())
  })

  it('supports controlled radio menu items', async () => {
    const onValueChange = jest.fn()

    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup
            value="date"
            onValueChange={onValueChange}
          >
            <DropdownMenuRadioItem value="date">Date</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    )

    openMenu()
    const item = screen.getByRole('menuitemradio', { name: 'Name' })
    expect(item.getAttribute('aria-checked')).toBe('false')
    fireEvent.click(item)
    expect(onValueChange).toHaveBeenCalledWith('name', expect.anything())
  })

  it('opens a submenu through the menu keyboard interaction', async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>More actions</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Nested action</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    )

    openMenu()
    const submenuTrigger = screen.getByRole('menuitem', {
      name: 'More actions',
    })
    fireEvent.keyDown(submenuTrigger, { key: 'ArrowRight', code: 'ArrowRight' })

    expect(await screen.findByRole('menuitem', { name: 'Nested action' })).toBeTruthy()
  })
})
