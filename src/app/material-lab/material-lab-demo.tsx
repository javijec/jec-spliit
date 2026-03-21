'use client'

import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import '@material/web/checkbox/checkbox.js'
import '@material/web/chips/assist-chip.js'
import '@material/web/select/outlined-select.js'
import '@material/web/select/select-option.js'
import '@material/web/slider/slider.js'
import '@material/web/switch/switch.js'
import '@material/web/textfield/outlined-text-field.js'

import { useMemo, useState } from 'react'

type MaterialTone = 'calm' | 'night'

const toneStyles: Record<MaterialTone, Record<string, string>> = {
  calm: {
    '--md-sys-color-primary': '#0f766e',
    '--md-sys-color-on-primary': '#ffffff',
    '--md-sys-color-primary-container': '#ccece6',
    '--md-sys-color-on-primary-container': '#0f3d39',
    '--md-sys-color-secondary': '#5d6b67',
    '--md-sys-color-on-secondary': '#ffffff',
    '--md-sys-color-secondary-container': '#dbe5e1',
    '--md-sys-color-on-secondary-container': '#19211f',
    '--md-sys-color-surface': '#fcfbf8',
    '--md-sys-color-surface-container': '#f1ede6',
    '--md-sys-color-surface-container-high': '#ebe6de',
    '--md-sys-color-on-surface': '#1d2a27',
    '--md-sys-color-outline': '#82918c',
    '--md-ref-typeface-brand': '"Segoe UI Variable Text", "Helvetica Neue", sans-serif',
    '--md-ref-typeface-plain': '"Segoe UI Variable Text", "Helvetica Neue", sans-serif',
  },
  night: {
    '--md-sys-color-primary': '#7ad1c5',
    '--md-sys-color-on-primary': '#073631',
    '--md-sys-color-primary-container': '#134a43',
    '--md-sys-color-on-primary-container': '#b9f1e9',
    '--md-sys-color-secondary': '#b5c9c3',
    '--md-sys-color-on-secondary': '#22302c',
    '--md-sys-color-secondary-container': '#394743',
    '--md-sys-color-on-secondary-container': '#d1e5df',
    '--md-sys-color-surface': '#121816',
    '--md-sys-color-surface-container': '#1b2320',
    '--md-sys-color-surface-container-high': '#22302c',
    '--md-sys-color-on-surface': '#e5efeb',
    '--md-sys-color-outline': '#8a9b96',
    '--md-ref-typeface-brand': '"Segoe UI Variable Text", "Helvetica Neue", sans-serif',
    '--md-ref-typeface-plain': '"Segoe UI Variable Text", "Helvetica Neue", sans-serif',
  },
}

export function MaterialLabDemo() {
  const [tone, setTone] = useState<MaterialTone>('calm')
  const [notifications, setNotifications] = useState(true)
  const [splitValue, setSplitValue] = useState(55)
  const [notesRequired, setNotesRequired] = useState(true)

  const wrapperStyle = useMemo(
    () => toneStyles[tone] as React.CSSProperties,
    [tone],
  )

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="border bg-card">
        <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Material Lab
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Laboratorio aislado para probar Material Web dentro de Next 16.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTone('calm')}
              className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                tone === 'calm'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-secondary'
              }`}
            >
              Claro
            </button>
            <button
              type="button"
              onClick={() => setTone('night')}
              className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                tone === 'night'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-secondary'
              }`}
            >
              Oscuro
            </button>
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1.3fr,0.7fr]">
          <div
            className="border-b p-5 lg:border-b-0 lg:border-r"
            style={wrapperStyle}
          >
            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <md-outlined-text-field
                  label="Nombre del gasto"
                  value="Cena del viernes"
                ></md-outlined-text-field>
                <md-outlined-select label="Moneda" value="ars">
                  <md-select-option value="ars" selected>
                    <div slot="headline">ARS</div>
                  </md-select-option>
                  <md-select-option value="usd">
                    <div slot="headline">USD</div>
                  </md-select-option>
                </md-outlined-select>
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr,auto] sm:items-start">
                <md-outlined-text-field
                  type="number"
                  label="Importe"
                  value="12500"
                ></md-outlined-text-field>
                <div className="flex gap-2">
                  <md-filled-button>Guardar prueba</md-filled-button>
                  <md-outlined-button>Cancelar</md-outlined-button>
                </div>
              </div>

              <div className="border bg-[color:var(--md-sys-color-surface-container)] p-4 text-[color:var(--md-sys-color-on-surface)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">Notificaciones</div>
                    <div className="text-sm opacity-75">
                      Control simple con switch y tokens Material.
                    </div>
                  </div>
                  <md-switch
                    selected={notifications}
                    onClick={() => setNotifications((value) => !value)}
                  ></md-switch>
                </div>
              </div>

              <div className="border bg-[color:var(--md-sys-color-surface-container)] p-4 text-[color:var(--md-sys-color-on-surface)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">División manual</div>
                    <div className="text-sm opacity-75">
                      {splitValue}% del total para el participante seleccionado.
                    </div>
                  </div>
                  <md-assist-chip label="Balance fino"></md-assist-chip>
                </div>
                <div className="mt-4">
                  <md-slider
                    min={0}
                    max={100}
                    step={5}
                    value={splitValue}
                    onInput={(event: React.FormEvent<HTMLElement>) => {
                      const target = event.currentTarget as HTMLElement & {
                        value?: string
                        valueAsNumber?: number
                      }
                      setSplitValue(
                        target.valueAsNumber ?? Number(target.value ?? 0),
                      )
                    }}
                  ></md-slider>
                </div>
              </div>

              <label className="flex items-center gap-3 border bg-[color:var(--md-sys-color-surface-container)] px-4 py-3 text-[color:var(--md-sys-color-on-surface)]">
                <md-checkbox
                  checked={notesRequired}
                  onClick={() => setNotesRequired((value) => !value)}
                ></md-checkbox>
                <span className="text-sm">Solicitar nota obligatoria</span>
              </label>
            </div>
          </div>

          <aside className="p-5">
            <div className="grid gap-4">
              <div className="border bg-background p-4">
                <h2 className="text-base font-semibold">Qué estamos probando</h2>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>Componentes web reales de `@material/web` dentro de App Router.</li>
                  <li>Tokens Material 3 conectados a una paleta compatible con NexoGastos.</li>
                  <li>Convivencia entre Tailwind actual y custom elements.</li>
                </ul>
              </div>

              <div className="border bg-background p-4">
                <h2 className="text-base font-semibold">Siguiente paso sugerido</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Si esta base te convence, el siguiente experimento sano es migrar
                  una pantalla chica y autocontenida, por ejemplo el perfil o el
                  selector de participante activo.
                </p>
              </div>

              <div className="border bg-background p-4 text-sm text-muted-foreground">
                Ruta disponible: <code>/material-lab</code>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
