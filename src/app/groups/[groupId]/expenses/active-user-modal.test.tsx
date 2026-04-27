import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import {
  ActiveUserForm,
  shouldPromptForActiveParticipant,
} from './active-user-modal'

const mutateAsyncMock = jest.fn()
const setDataMock = jest.fn()

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
        get: { setData: setDataMock },
        getDetails: { setData: setDataMock },
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
    disabled,
  }: {
    value: string
    id: string
    checked?: boolean
    onChange?: React.ChangeEventHandler<HTMLInputElement>
    disabled?: boolean
  }) => (
    <input
      type="radio"
      id={id}
      value={value}
      checked={checked}
      onChange={onChange}
      disabled={disabled}
    />
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
            { id: 'participant-1', name: 'Juan', appUserId: null },
            { id: 'participant-2', name: 'Maria', appUserId: null },
          ],
        } as never}
        currentActiveParticipantId="participant-2"
        isAuthenticated
        currentUserId="user-1"
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
    expect(setDataMock).toHaveBeenCalled()
    expect(close).toHaveBeenCalled()
  })

  it('stores the guest selection in localStorage', async () => {
    const close = jest.fn()

    render(
      <ActiveUserForm
        group={{
          id: 'group-1',
          name: 'Viaje',
          participants: [{ id: 'participant-1', name: 'Juan', appUserId: null }],
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

  it('disables participants already linked to another authenticated user', () => {
    render(
      <ActiveUserForm
        group={{
          id: 'group-1',
          name: 'Viaje',
          participants: [
            { id: 'participant-1', name: 'Juan', appUserId: 'user-2' },
            { id: 'participant-2', name: 'Maria', appUserId: 'user-1' },
          ],
        } as never}
        isAuthenticated
        currentUserId="user-1"
        close={jest.fn()}
      />,
    )

    expect(screen.getByLabelText(/Juan/i).getAttribute('disabled')).not.toBeNull()
    expect(screen.getByLabelText(/Maria/i).getAttribute('disabled')).toBeNull()
    expect(screen.getByText(/ya vinculado/i)).toBeTruthy()
  })
})

describe('shouldPromptForActiveParticipant', () => {
  it('waits for auth resolution before using guest fallback', () => {
    expect(
      shouldPromptForActiveParticipant({
        isAuthResolved: false,
        viewer: null,
        currentActiveParticipantId: null,
        tempUser: null,
        activeUser: null,
      }),
    ).toBe(false)
  })

  it('prompts authenticated user only when no participant selected', () => {
    expect(
      shouldPromptForActiveParticipant({
        isAuthResolved: true,
        viewer: { id: 'user-1' } as never,
        currentActiveParticipantId: null,
        tempUser: null,
        activeUser: null,
      }),
    ).toBe(true)

    expect(
      shouldPromptForActiveParticipant({
        isAuthResolved: true,
        viewer: { id: 'user-1' } as never,
        currentActiveParticipantId: 'participant-1',
        tempUser: null,
        activeUser: null,
      }),
    ).toBe(false)
  })
})
