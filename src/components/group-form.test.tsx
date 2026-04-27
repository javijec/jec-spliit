import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { GroupForm } from './group-form'

const viewerQueryMock = jest.fn()

jest.mock('next-intl', () => ({
  useLocale: () => 'es-AR',
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      title: 'Informacion del grupo',
      'NameField.label': 'Nombre del grupo',
      'NameField.placeholder': 'Vacaciones de verano',
      'NameField.description': 'Descripcion nombre',
      'CurrencyCodeField.label': 'Moneda por defecto',
      'CurrencyCodeField.customOption': 'Personalizada',
      'CurrencyCodeField.createDescription': 'Descripcion moneda',
      'CurrencyCodeField.editDescription': 'Descripcion moneda editar',
      'CurrencyField.label': 'Moneda',
      'CurrencyField.description': 'Descripcion simbolo',
      'CurrencyField.placeholder': '$',
      'Participants.title': 'Participantes',
      'Participants.description': 'Ingresa participantes',
      'Participants.new': 'Nuevo',
      'Participants.add': 'Añadir participante',
      'Participants.protectedParticipant': 'Participante protegido',
      'Participants.John': 'Juan',
      'Participants.Jane': 'Maria',
      'Participants.Jack': 'Sergio',
      'Settings.title': 'Ajustes locales',
      'Settings.description': 'Descripcion ajustes',
      'Settings.ActiveUserField.label': 'Usuario activo',
      'Settings.ActiveUserField.description': 'Descripcion usuario activo',
      'Settings.ActiveUserField.placeholder': 'Elegir',
      'Settings.ActiveUserField.none': 'Ninguno',
      'Settings.save': 'Guardar',
      'Settings.saving': 'Guardando',
      'Settings.create': 'Crear',
      'Settings.creating': 'Creando',
      'Settings.cancel': 'Cancelar',
      min2: 'min2',
      max50: 'max50',
    }
    return translations[key] ?? key
  },
}))

jest.mock('@/trpc/client', () => ({
  trpc: {
    viewer: {
      getCurrent: {
        useQuery: () => viewerQueryMock(),
      },
    },
  },
}))

jest.mock('./currency-selector', () => ({
  CurrencySelector: ({ defaultValue }: { defaultValue?: string }) => (
    <div data-testid="currency-selector">{defaultValue}</div>
  ),
}))

jest.mock('./submit-button', () => ({
  SubmitButton: ({
    children,
    onClick,
    loadingContent,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    loadingContent?: React.ReactNode
  }) => (
    <button type="submit" onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

jest.mock('./ui/button', () => ({
  Button: ({
    children,
    asChild,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) =>
    asChild ? <span>{children}</span> : <button {...props}>{children}</button>,
}))

jest.mock('./ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

jest.mock('./ui/form', () => ({
  Form: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  FormControl: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  FormItem: ({ children, hidden }: { children: React.ReactNode; hidden?: boolean }) =>
    hidden ? null : <div>{children}</div>,
  FormLabel: ({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
    <label {...props}>{children}</label>
  ),
  FormMessage: () => null,
  FormField: ({
    render,
    control,
    name,
  }: {
    render: (props: {
      field: {
        name: string
        value: unknown
        onChange: (...event: unknown[]) => void
        onBlur: () => void
        ref: () => void
      }
    }) => React.ReactNode
    control: {
      register: (name: string) => {
        name: string
        onChange: (...event: unknown[]) => void
        onBlur: () => void
        ref: () => void
      }
      _formValues: Record<string, unknown>
    }
    name: string
  }) =>
    render({
      field: {
        ...control.register(name),
        value: control._formValues[name],
      },
    }),
}))

jest.mock('./ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}))

jest.mock('./ui/select', () => {
  const React = require('react')

  const SelectContext = React.createContext({})

  return {
    Select: ({
      children,
      onValueChange,
      defaultValue,
    }: {
      children: React.ReactNode
      onValueChange?: (value: string) => void
      defaultValue?: string
    }) => (
      <SelectContext.Provider value={{ value: defaultValue, onValueChange }}>
        <div>{children}</div>
      </SelectContext.Provider>
    ),
    SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
    SelectContent: ({ children }: { children: React.ReactNode }) => {
      const { onValueChange } = React.useContext(SelectContext)
      return (
        <div>
          {React.Children.map(children, (child: React.ReactElement<{ value: string }>) =>
            React.cloneElement(child, { onSelectValue: onValueChange }),
          )}
        </div>
      )
    },
    SelectItem: ({
      children,
      value,
      onSelectValue,
    }: {
      children: React.ReactNode
      value: string
      onSelectValue?: (value: string) => void
    }) => (
      <button type="button" onClick={() => onSelectValue?.(value)}>
        {children}
      </button>
    ),
  }
})

jest.mock('./ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

jest.mock('./ui/alert', () => ({
  Alert: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

jest.mock('./ui/hover-card', () => ({
  HoverCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  HoverCardTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  HoverCardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('GroupForm', () => {
  beforeEach(() => {
    viewerQueryMock.mockReturnValue({ data: { user: { id: 'user-1' } } })
  })

  it('submits the persisted authenticated participant by membership id', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)

    render(
      <GroupForm
        group={{
          id: 'group-1',
          name: 'Viaje',
          information: '',
          currency: '$',
          currencyCode: 'USD',
          createdAt: new Date(),
          participants: [
            { id: 'participant-1', name: 'Juan', groupId: 'group-1', appUserId: null },
            { id: 'participant-2', name: 'Maria', groupId: 'group-1', appUserId: null },
          ],
        }}
        currentActiveParticipantId="participant-1"
        onSubmit={onSubmit}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Viaje' }),
        {
          participantId: 'participant-1',
          activeParticipantName: 'Juan',
        },
      ),
    )
  })

  it('defaults to the first participant when there is no persisted active selection', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)

    render(
      <GroupForm
        group={{
          id: 'group-1',
          name: 'Viaje',
          information: '',
          currency: '$',
          currencyCode: 'USD',
          createdAt: new Date(),
          participants: [
            { id: 'participant-1', name: 'Juan', groupId: 'group-1', appUserId: null },
            { id: 'participant-2', name: 'Maria', groupId: 'group-1', appUserId: null },
          ],
        }}
        onSubmit={onSubmit}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Viaje' }),
        {
          participantId: 'participant-1',
          activeParticipantName: 'Juan',
        },
      ),
    )
  })
})
