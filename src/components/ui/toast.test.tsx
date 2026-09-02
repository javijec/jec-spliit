import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'

import { ToastAction } from './toast'
import { Toaster } from './toaster'
import { toast, toastManager } from './use-toast'

describe('Toast', () => {
  afterEach(() => {
    act(() => toastManager.close())
  })

  it('renders imperative title, description, variant, and action', async () => {
    render(<Toaster />)

    await act(async () => {
      toast({
        title: 'Upload failed',
        description: 'Try the upload again.',
        variant: 'destructive',
        action: <ToastAction altText="Retry">Retry</ToastAction>,
        duration: 0,
      })
    })

    const toastRoot = await screen.findByRole('alertdialog', { hidden: true })
    expect(toastRoot).toBeTruthy()
    expect(within(toastRoot).getByText('Try the upload again.')).toBeTruthy()
    fireEvent.mouseEnter(screen.getByRole('region', { name: 'Notifications' }))
    expect(
      within(toastRoot).getByRole('button', { name: 'Retry', hidden: true }),
    ).toBeTruthy()
    expect(
      toastRoot.getAttribute('data-type'),
    ).toBe('destructive')
  })

  it('dismisses through the returned imperative handle and close button', async () => {
    render(<Toaster />)

    let created: ReturnType<typeof toast> | undefined
    await act(async () => {
      created = toast({ title: 'Dismiss me', duration: 0 })
    })
    expect(await screen.findByText('Dismiss me')).toBeTruthy()

    act(() => created?.dismiss())
    await waitFor(() => expect(screen.queryByText('Dismiss me')).toBeNull())

    await act(async () => {
      toast({ title: 'Close me', duration: 0 })
    })
    fireEvent.mouseEnter(screen.getByRole('region', { name: 'Notifications' }))
    fireEvent.click(await screen.findByRole('button'))
    await waitFor(() => expect(screen.queryByText('Close me')).toBeNull())
  })

  it('keeps only the newest toast visible at the configured limit', async () => {
    render(<Toaster />)

    await act(async () => {
      toast({ title: 'First toast', duration: 0 })
      toast({ title: 'Second toast', duration: 0 })
    })

    expect(await screen.findByText('Second toast')).toBeTruthy()
    expect(screen.getByText('First toast').closest('[data-limited]')).toBeTruthy()
  })
})
