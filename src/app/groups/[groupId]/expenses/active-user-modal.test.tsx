import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ActiveUserForm } from './active-user-modal'

const mutateAsyncMock = jest.fn()
const invalidateMock = jest.fn()

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      title: 'Usuario activo',
      description: 'Elegi usuario',
      nobody: 'Nadie',
      save: 'Guardar',
      footer: 'Pie',
    }
    return translations[key] ?? key
  },
}))

jest.mock('@/trpc/client', () => ({
  trpc: {
    useUtils: () => ({
      groups: {
        get: { invalidate: invalidateMock },
        getDetails: { invalidate: invalidateMock },
      },
    }),
    groups: {
      setActiveParticipant: {
        useMutation: () => ({
          mutateAsync: mutateAsyncMock,
          isPending: false,
        }),
      },
    },
  },
}))

jest.mock('@/components/ui/button', () => ({
  Button: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props} />,
}))

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
    <label {...props}>{children}</label>
  ),
}))

jest.mock('@/components/ui/radio-group', () => ({
  RadioGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  RadioGroupItem: ({
    value,
    id,
    checked,
    onChange,
  }: {
    value: string
    id: string
    checked?: boolean
    onChange?: React.ChangeEventHandler<HTMLInputElement>
  }) => (
    <input type="radio" id={id} value={value} checked={checked} onChange={onChange} />
  ),
}))

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

jest.mock('@/components/ui/drawer', () => ({
  Drawer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('ActiveUserForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  it('persists the authenticated participant selection in the backend', async () => {
    const close = jest.fn()

    render(
      <ActiveUserForm
        group={{
          id: 'group-1',
          name: 'Viaje',
          participants: [
            { id: 'participant-1', name: 'Juan' },
            { id: 'participant-2', name: 'Maria' },
          ],
        } as never}
        currentActiveParticipantId="participant-2"
        isAuthenticated
        close={close}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() =>
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        groupId: 'group-1',
        participantId: 'participant-2',
      }),
    )
    expect(invalidateMock).toHaveBeenCalledWith({ groupId: 'group-1' })
    expect(close).toHaveBeenCalled()
  })

  it('stores the guest selection in localStorage', async () => {
    const close = jest.fn()

    render(
      <ActiveUserForm
        group={{
          id: 'group-1',
          name: 'Viaje',
          participants: [{ id: 'participant-1', name: 'Juan' }],
        } as never}
        isAuthenticated={false}
        close={close}
      />,
    )

    fireEvent.click(screen.getByLabelText('Nadie'))
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() =>
      expect(localStorage.getItem('group-1-activeUser')).toBe('None'),
    )
    expect(mutateAsyncMock).not.toHaveBeenCalled()
    expect(close).toHaveBeenCalled()
  })
})
