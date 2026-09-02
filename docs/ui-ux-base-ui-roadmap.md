# JEC Spliit — UI/UX + Base UI implementation roadmap

> Estado: plan de implementación
> Rama objetivo inicial: `main`
> Prioridad: mobile-first, accesibilidad, velocidad de carga de gastos y claridad para saldar cuentas
> Base UI objetivo: `@base-ui/react` (migración progresiva)

## 1. Objetivo

Modernizar la UI y la UX de JEC Spliit sin reescribir la aplicación ni alterar innecesariamente su arquitectura de datos.

La experiencia debe quedar organizada alrededor de cuatro acciones mentales principales:

1. Entrar a un grupo.
2. Agregar un gasto.
3. Entender inmediatamente quién debe qué.
4. Saldar las cuentas.

El cambio de librería visual se realizará de forma progresiva hacia **Base UI**, manteniendo Tailwind como capa de estilos y evitando una migración big-bang.

---

## 2. Principios del rediseño

### 2.1 Mobile-first real

La aplicación ya funciona como PWA y dispone de navegación inferior móvil. Las nuevas decisiones deben priorizar el uso con una mano y acciones frecuentes en pantallas pequeñas.

### 2.2 Mostrar acciones, no solamente datos

Un balance del tipo `Javier: -$15.400` es correcto, pero obliga al usuario a interpretar qué hacer.

La interfaz debe priorizar expresiones accionables:

- `Javier paga $15.400 a Ana`.
- `Te deben $18.320`.
- `Debés $11.740`.
- `Todos están a mano`.

### 2.3 Progressive disclosure

El flujo común debe ser extremadamente corto.

Ejemplo para crear gasto:

- descripción;
- monto;
- quién pagó;
- guardar.

Opciones menos frecuentes como categoría, fecha, moneda, notas, división personalizada o participantes deben quedar en `Más opciones`.

### 2.4 Menos cajas, más jerarquía

Reducir la cantidad de combinaciones `border + rounded + card dentro de card`.

Usar prioritariamente:

- espacio;
- tipografía;
- separadores;
- grupos visuales;
- estados semánticos.

### 2.5 Color semántico separado del branding

No reutilizar el color `primary` como indicador financiero.

Definir tokens independientes para:

- positivo / te deben;
- negativo / debés;
- pendiente;
- neutral / saldado;
- branding / acciones primarias.

### 2.6 Accesibilidad como comportamiento base

Usar los primitives de Base UI para diálogos, menús, selects, tooltips, drawers, tabs, popovers, checkboxes, etc. y conservar una capa de componentes propios dentro de `src/components/ui`.

La aplicación no debe importar Base UI de forma arbitraria en cada feature si existe un wrapper del design system.

---

# 3. Estrategia Base UI

## 3.1 Dependencia

Agregar:

```bash
bun add @base-ui/react
```

No eliminar Radix, Vaul ni otras dependencias UI en el mismo commit.

Primero se migra componente por componente; al final se eliminan dependencias sin uso.

## 3.2 Mantener `src/components/ui` como frontera

El objetivo no es reemplazar los componentes propios por imports directos de Base UI en toda la aplicación.

Mantener una API local estable:

```text
src/components/ui/
  button.tsx
  dialog.tsx
  drawer.tsx
  dropdown-menu.tsx
  select.tsx
  tabs.tsx
  tooltip.tsx
  popover.tsx
  checkbox.tsx
  ...
```

Por dentro estos componentes podrán usar Base UI.

Ventajas:

- evita acoplar todas las pantallas a una librería externa;
- permite mantener variantes Tailwind existentes;
- simplifica una futura actualización;
- reduce el tamaño de los cambios por feature.

## 3.3 Composición

Base UI utiliza `render` para composición. Los wrappers deben adaptar esta API sin intentar copiar internamente el comportamiento de Radix.

Revisar especialmente patrones actuales como:

```tsx
<Button asChild>
  <Link ... />
</Button>
```

Durante la migración, definir una convención única para `Button + Link` para no terminar manteniendo simultáneamente APIs incompatibles.

### Convención de composición para las próximas fases

- Las features seguirán importando la API local de `src/components/ui`, no primitives de Base UI directamente.
- `asChild`/`Slot` continúa siendo la API vigente de los wrappers Radix existentes.
- Los wrappers que migren a Base UI encapsularán `render`; esa diferencia no se propagará a las features.
- La primera convergencia pública será `Button + Link`; no se agrega una segunda API de composición durante esta fase.

## 3.4 Portals y stacking context

Antes de migrar Dialog / Popover / Menu / Select:

- agregar un root aislado con `isolation: isolate`;
- revisar `src/app/layout.tsx`;
- revisar `src/app/globals.css`;
- comprobar overlays y `z-index` actuales;
- comprobar safe areas de la PWA.

Base UI recomienda un stacking context aislado para que los elementos portaled no compitan con el `z-index` de la aplicación.

También revisar el comportamiento de backdrop en Safari/iOS moderno.

## 3.5 Base UI no define la apariencia

Base UI es headless. JEC Spliit debe conservar Tailwind y construir un design system propio.

No intentar que la aplicación “se vea como Base UI”.

La identidad visual debe seguir siendo de JEC Spliit.

## 3.6 Fundación implementada en Fase 1

- `@base-ui/react` queda instalado como dependencia disponible, sin importar sus primitives desde las features.
- Los estados `success`, `danger`, `warning` y `settled` tienen tokens independientes para tema claro y oscuro, además de mappings `text-*`, `bg-*` y `border-*` de Tailwind.
- La geometría compartida expone radios para controles, superficies y overlays, un target táctil mínimo de `44px` y separación base de formularios.
- `ui-focus-ring` centraliza el foco visible de los wrappers nuevos; los controles existentes conservan cualquier matiz visual específico hasta su migración.
- El root `.app-root` crea un stacking context aislado; `body` conserva posición relativa para la compatibilidad con backdrops y safe areas de PWA.
- La jerarquía de capas existente se conserva: página, chrome de aplicación, popovers/menús, drawer/dialog y toast. La migración de primitives y cualquier ajuste de `z-index` quedan para fases posteriores.

---

# 4. Fase 0 — Baseline, inventario y protección contra regresiones

## Objetivo

Preparar el terreno antes de cambiar componentes compartidos.

## Tareas

- [ ] Documentar las rutas principales:
  - `/`;
  - `/groups`;
  - `/groups/create`;
  - `/groups/[groupId]/summary`;
  - `/groups/[groupId]/expenses`;
  - `/groups/[groupId]/expenses/create`;
  - edición de gasto;
  - `/groups/[groupId]/balances`;
  - settings/information/edit.
- [ ] Inventariar todos los imports de `@radix-ui/*`.
- [ ] Inventariar usos de `vaul`.
- [ ] Inventariar usos reales de `@material/web` y determinar si `material-lab` es producción, experimento o código descartable.
- [ ] Inventariar `cmdk` y componentes que dependen de él.
- [ ] Mapear cada primitive actual a Base UI.
- [ ] Capturar screenshots desktop y mobile de las pantallas principales antes de migrar.
- [ ] Crear pruebas de smoke para los flujos críticos.
- [ ] Asegurar que `bun run lint`, `bun run check-types` y `bun test` están verdes antes de comenzar.

## Pruebas mínimas a preservar

1. Crear grupo.
2. Entrar a un grupo existente.
3. Crear gasto.
4. Editar gasto.
5. Cambiar participante activo si corresponde.
6. Abrir balances.
7. Abrir menús contextuales.
8. Archivar/fijar/eliminar membresía según el flujo existente.
9. Navegar las cuatro pestañas móviles.

## Criterio de aceptación

Ningún cambio visual todavía. Debe existir una matriz de componentes y un baseline reproducible.

---

# 5. Fase 1 — Fundaciones del design system + Base UI

## Objetivo

Introducir Base UI sin alterar el producto completo.

## Archivos principales

- `package.json`
- `bun.lock`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/components/ui/*`

## Tareas

### 5.1 Instalar Base UI

- [ ] Agregar `@base-ui/react`.
- [ ] Mantener las dependencias Radix temporalmente.

### 5.2 Tokens semánticos

Agregar/revisar variables para:

- [ ] `--success`;
- [ ] `--success-foreground`;
- [ ] `--danger`;
- [ ] `--danger-foreground`;
- [ ] `--warning`;
- [ ] `--warning-foreground`;
- [ ] `--settled`;
- [ ] superficies y bordes de baja prominencia.

Crear utilities Tailwind/CSS para no escribir colores literales por feature.

### 5.3 Geometría y densidad

Definir reglas coherentes:

- radio de controles;
- radio de superficies;
- alturas touch (`44px` mínimo en acciones relevantes);
- spacing de formularios;
- ancho máximo de sheets/dialogs;
- sombras.

### 5.4 Focus y estados

Estandarizar:

- `focus-visible`;
- disabled;
- loading;
- destructive;
- selected;
- pressed;
- invalid.

## Criterio de aceptación

Base UI está instalado y existe una fundación visual estable, pero el comportamiento funcional continúa igual.

---

# 6. Fase 2 — Migración progresiva de primitives a Base UI

## Objetivo

Sustituir los primitives actuales sin modificar todavía los grandes flujos de negocio.

Migrar de menor riesgo a mayor riesgo.

## Orden recomendado

### 2A — Tooltip / Popover / Collapsible

- [x] `tooltip.tsx` → Base UI Tooltip.
- [x] `popover.tsx` → Base UI Popover.
- [x] `collapsible.tsx` → Base UI Collapsible.

#### Estado de implementación

- [x] `tooltip.tsx`, `popover.tsx` y `collapsible.tsx` mantienen la frontera local y usan Base UI internamente.
- [x] Los wrappers adaptan `asChild` a `render` sin propagar la API de Base UI a las features.
- [x] Las animaciones usan los atributos `data-starting-style` y `data-ending-style` de Base UI.
- [ ] La verificación visual y mobile de consumidores reales requiere un navegador con datos de la aplicación.

Validar:

- teclado;
- escape;
- focus;
- touch;
- portales.

### 2B — Checkbox / Radio / Switch

- [x] Checkbox.
- [x] Radio Group.
- [x] Switch: no existe wrapper ni consumer en el repositorio; no migrado.

#### Estado de implementación

- [x] `checkbox.tsx` y `radio-group.tsx` mantienen la frontera local y usan Base UI internamente.
- [x] Se preservan estados controlados/no controlados, disabled, required, name/value, labels y `indeterminate` del checkbox.
- [x] La integración booleana de Checkbox con React Hook Form está cubierta mediante `Controller`.
- [x] La navegación por flechas del Radio Group y los estados disabled/controlado están cubiertos.

Validar integración con React Hook Form.

### 2C — Dropdown Menu

- [x] Migrar `src/components/ui/dropdown-menu.tsx`.
- [x] Validar el menú de cards de grupos.
- [x] Validar destructive actions.
- [ ] Verificar mobile touch targets.

#### Estado de implementación

- [x] `dropdown-menu.tsx` mantiene la frontera local y usa `Menu.Root`, `Trigger`, `Portal`, `Positioner`, `Popup`, `Item`, `CheckboxItem`, `RadioGroup`, `RadioItem`, `Group`, `GroupLabel`, `Separator`, `SubmenuRoot` y `SubmenuTrigger` de Base UI.
- [x] `asChild` se conserva en los wrappers públicos relevantes y se adapta internamente a `render`; las features no importan Base UI directamente.
- [x] Se preservan las exportaciones locales, el posicionamiento `side`/`align`/`sideOffset`, el portal, los estados destructivos y la composición de links del menú de exportación.
- [x] Los items del menú conservan un target táctil mínimo de `40px`; el trigger de la card mantiene su clase histórica `h-9 w-9` y requiere una decisión visual específica antes de ampliarlo.
- [x] La cobertura Jest verifica apertura, navegación, Escape, retorno de foco, disabled, click handlers, checkbox, radio, composición `asChild` y submenú.
- [ ] La verificación visual, mobile y de datos reales requiere un navegador autenticado.

### 2D — Dialog

- [x] Migrar `dialog.tsx`.
- [x] Revisar ActiveUserModal.
- [x] Revisar confirmaciones destructivas.
- [x] Revisar nested dialogs si existen; no existen consumidores nested en el inventario actual.

#### Estado de implementación

- [x] `dialog.tsx` mantiene la frontera local y usa `Dialog.Root`, `Trigger`, `Portal`, `Backdrop`, `Viewport`, `Popup`, `Title`, `Description` y `Close` de Base UI.
- [x] `asChild` se conserva en `DialogTrigger` y `DialogClose` y se adapta internamente a `render`; las features no importan Base UI directamente.
- [x] Se preservan las exportaciones locales, el cierre por Escape/overlay/acción explícita, el retorno de foco, el scroll lock, el portal y el padding responsive de safe area.
- [x] La cobertura Jest verifica apertura, título/descripción accesibles, controlado, Escape, outside press, cierre explícito y retorno de foco.
- [ ] La verificación visual, mobile, ActiveUserModal autenticado, reembolsos y datos reales requiere un navegador autenticado.

### 2E — Select / Combobox

- [x] Migrar Select.
- [x] Evaluar y reemplazar las combinaciones `cmdk + Popover/Drawer` de CategorySelector y CurrencySelector por Base UI Combobox donde corresponde.
- [x] Confirmar que no existen command palettes reales; retirar `cmdk` y `command.tsx` sin reemplazar una superficie que no existe.

#### Estado de implementación

- [x] `select.tsx` mantiene la API local y encapsula Base UI `Select`, `Portal`, `Positioner`, `Popup`, `List`, `Item` y estados equivalentes; los formularios conservan valores string, `defaultValue`/controlado, `disabled`, `required`, `name` y serialización compatible con React Hook Form.
- [x] `CategorySelector` y `CurrencySelector` usan el wrapper local `combobox.tsx` con filtrado Base UI mediante `Collection`, manteniendo Popover desktop y el Drawer mobile local, incluyendo búsqueda, selección y no-results.
- [x] Se verificaron apertura, selección, controlled/uncontrolled, disabled, Escape, placeholder/value, retorno de foco y comportamiento de colección en Jest + Testing Library.
- [x] Se eliminaron las dependencias directas `@radix-ui/react-select` y `cmdk`; `vaul` se retiró durante la fase 2G.
- [ ] La verificación visual, mobile, datos reales y comportamiento browser autenticado requieren un navegador con runtime y fixtures disponibles.

### 2F — Tabs

- [x] Migrar el wrapper local `tabs.tsx` de Radix Tabs a Base UI Tabs; no existen consumidores de producción actuales.
- [x] Preservar `Tabs`, `TabsList`, `TabsTrigger` y `TabsContent`, incluyendo valores controlados/no controlados, orientación horizontal/vertical, estados visuales y asociaciones ARIA.
- [x] Mantener activación automática al enfocar mediante `TabsList activateOnFocus={true}` por defecto, equivalente al comportamiento previo de Radix; se puede solicitar activación manual explícitamente.
- [x] Eliminar `@radix-ui/react-tabs` después de confirmar cero imports reales.
- [x] NO reemplazar la bottom navigation móvil por Tabs: sigue siendo navegación entre rutas reales.
- [ ] La verificación visual, mobile y browser autenticado requiere un runtime con fixtures disponibles.

### 2G — Drawer

- [x] Migrar `src/components/ui/drawer.tsx` de Vaul a Base UI Drawer, manteniendo la API local y ocultando los detalles de portal, backdrop, viewport y popup de los consumidores.
- [x] Preservar el bottom sheet móvil: posición inferior, esquinas superiores redondeadas, handle, altura máxima `min(85dvh, 42rem)`, scroll interno, safe-area inferior, Escape, backdrop, cierre explícito, retorno de foco y gestos de swipe mediante la API de Base UI.
- [x] Mantener `open`/`defaultOpen`/`onOpenChange`, composición `asChild` mediante `render`, y soporte de teclado virtual con `VirtualKeyboardProvider`.
- [x] Validar en Jest el wrapper y los consumidores móviles CategorySelector y CurrencySelector; ActiveUserModal usa `DrawerDescription` en su rama móvil y ShareButton conserva el contrato local.
- [x] Confirmar cero imports reales de Vaul y retirar `vaul` de `package.json` y `bun.lock`.
- [ ] Verificar en navegador autenticado y viewport `390x844` los gestos, scroll lock, teclado móvil, safe areas, nesting Dialog/Drawer y el flujo de ActiveUserModal; queda explícitamente pendiente por falta de fixtures/autenticación reproducibles.
- [ ] Quick Add y nuevas acciones contextuales móviles quedan fuera de esta fase y requieren su prompt propio.

### 2H — Toast / Hover Card cleanup

- [x] Migrar `src/components/ui/toast.tsx` y `src/components/ui/toaster.tsx` de Radix Toast a Base UI Toast, manteniendo la API imperativa local `useToast()` / `toast({...})`.
- [x] Preservar títulos, descripciones, variantes `default`/`destructive`, acciones, dismiss, timeout de 5 segundos, límite de un toast y el viewport global por encima de los overlays existentes.
- [x] Usar un `Toast.createToastManager()` singleton para que los consumidores sigan siendo independientes del árbol React; `Toaster` posee el Provider, Portal, Viewport y la lista reactiva.
- [x] Migrar `src/components/ui/hover-card.tsx` a Base UI `PreviewCard`, manteniendo la frontera local, `align`, `sideOffset` y composición `render`.
- [x] Corregir el único consumer real de `HoverCard` en `src/components/group-form.tsx` para evitar anidar un `Button` dentro del anchor por defecto de Preview Card.
- [x] Cubrir en Jest la creación imperativa, copy, variante, acción, dismiss, límite/stacking y la apertura por pointer hover/focus y cierre por Escape.
- [x] Confirmar cero imports reales y retirar `@radix-ui/react-toast` y `@radix-ui/react-hover-card` de `package.json` y `bun.lock`.
- [ ] La verificación visual autenticada, viewport `390x844`, safe area real, stacking con Drawer/Dialog y comportamiento táctil de Preview Card requieren un navegador con fixtures disponibles.
- [ ] Preview Card continúa siendo una mejora visual no modal para pointer/keyboard; no se inventó una interacción primaria equivalente para touch/screen reader.

## Regla

Cada migración de primitive debe ser un commit separado o grupo pequeño de commits.

Ejemplos:

```text
refactor(ui): migrate tooltip and popover to Base UI
refactor(ui): migrate dropdown menu to Base UI
refactor(ui): migrate dialog to Base UI
refactor(ui): migrate form controls to Base UI
```

## Criterio de aceptación

Los primitives prioritarios ya usan Base UI y las pantallas continúan funcionalmente equivalentes.

---

# 7. Fase 3 — Rediseño de `/groups`

## Objetivo

Transformar la lista de grupos de un historial técnico a un dashboard útil.

## Archivos principales

- `src/app/groups/recent-group-list.tsx`
- `src/app/groups/recent-group-list-card.tsx`
- helpers/API necesarios para aportar resumen financiero.

## Problema actual

La card prioriza:

- nombre;
- cantidad de participantes;
- fecha de creación.

La fecha de creación tiene poco valor operativo.

## Nuevo contenido de card

Ejemplo:

```text
[VM]  Viaje Mendoza                 ...
      4 personas · movimiento hace 2 h

      Gastado                    $294.640
      Te deben                    $18.320
```

O:

```text
      Debés                        $11.740
```

## Tareas

- [ ] Reemplazar el icono genérico idéntico por avatar de grupo.
- [ ] Generar iniciales y color determinístico por `group.id`.
- [ ] Mostrar cantidad de participantes de forma secundaria.
- [ ] Mostrar último movimiento en vez de fecha de creación.
- [ ] Mostrar monto total del grupo cuando sea razonable.
- [ ] Mostrar saldo personal si el usuario tiene participante asociado.
- [ ] Mantener información simple para guest/legacy groups.
- [ ] Evitar consultas N+1; ampliar `groups.mine` para devolver el resumen necesario.
- [ ] Mantener optimistic update de pin/archive/remove.

## Simplificación conceptual

Cambiar lenguaje orientado a estructura por lenguaje orientado a tareas:

- `Starred` → `Fijados` / `Fijar arriba`.
- `Archived` → preferentemente `Finalizados` cuando se implemente estado de cierre.

No cambiar todavía la semántica del backend si requiere una migración de datos; primero puede ser sólo presentación.

## Criterio de aceptación

Desde `/groups`, un usuario puede identificar sin abrir cada grupo:

- cuál está activo;
- cuál tuvo actividad reciente;
- si debe dinero o le deben.

---

# 8. Fase 4 — Dashboard real del grupo

## Objetivo

Hacer que `/summary` responda las preguntas principales sin obligar a navegar a otras pestañas.

## Jerarquía propuesta

### Bloque 1 — Total

```text
Viaje a Mendoza
$294.640 gastados
4 participantes · ARS
```

### Bloque 2 — Tu situación

Uno de:

```text
Te deben $18.320
```

```text
Debés $11.740
```

```text
Estás al día
```

### Bloque 3 — Próxima acción

```text
Para saldar
Nico → Ana      $11.740
Tomi → Juli      $6.580
```

### Bloque 4 — Gastos recientes

Mostrar 3-5 gastos con acceso a la lista completa.

### Bloque 5 — Actividad reciente (fase posterior habilitable)

## Tareas

- [ ] Crear un summary query agregado si las consultas actuales requieren múltiples round trips.
- [ ] Mostrar skeleton estable para evitar layout shift.
- [ ] Reutilizar datos prefetched actuales.
- [ ] Mantener bottom navigation actual.
- [ ] Mantener FAB, pero cambiar su representación según Fase 6.

## Criterio de aceptación

Un usuario entiende el estado del grupo en menos de unos segundos sin abrir Balances.

---

# 9. Fase 5 — Balances orientados a acciones

## Objetivo

Cambiar el foco de `saldo por persona` a `quién paga a quién`.

## Nueva pantalla

### Sección principal — Pagos sugeridos

```text
Pagos para quedar a mano

Javier  →  Ana
$15.400
[Marcar como pagado]
```

### Sección secundaria — Balances individuales

```text
Ana      +$15.400
Javier   -$15.400
```

Para múltiples monedas, agrupar sin crear una card visual completa por cada valor si no es necesaria.

## Tareas

- [ ] Reutilizar/crear algoritmo de simplificación de deudas.
- [ ] Agregar tests deterministas para settlement suggestions.
- [ ] Mostrar `quién paga a quién` antes de saldos técnicos.
- [ ] Mantener saldos individuales como sección expandible/secundaria.
- [ ] Usar color semántico success/danger, no `primary`.
- [ ] Crear empty state especial: `Todos están a mano`.

## Estado cero

```text
✓ Todos están a mano
No quedan pagos pendientes en este grupo.
```

## Criterio de aceptación

El usuario no debe calcular mentalmente qué transferencia realizar.

---

# 10. Fase 6 — Settlements / “Marcar como pagado”

## Objetivo

Cerrar el ciclo de vida de una deuda dentro de JEC Spliit.

## UX propuesta

En cada pago sugerido:

```text
Javier → Ana
$15.400

[Marcar como pagado]
```

Al pulsar:

1. Abrir Base UI Dialog en desktop o Drawer en mobile.
2. Mostrar pagador, receptor, monto y moneda.
3. Confirmar.
4. Registrar settlement.
5. Actualizar balances optimísticamente.
6. Mostrar toast con Undo si la arquitectura permite reversión segura.

## Backend / datos

Antes de implementar, decidir explícitamente entre:

### Opción A — Settlement como entidad propia

Preferida a largo plazo.

Campos orientativos:

- id;
- groupId;
- payerParticipantId;
- receiverParticipantId;
- amount;
- currency;
- createdAt;
- createdBy;
- optional note.

### Opción B — Settlement como gasto especial

Más simple si el modelo actual ya permite transferencias, pero hay que evitar contaminar reportes de gasto.

## Tareas

- [ ] Diseñar schema.
- [ ] Migración Prisma si corresponde.
- [ ] Crear mutation.
- [ ] Actualizar algoritmo de balances.
- [ ] Actualizar exportación.
- [ ] Añadir actividad del settlement.
- [ ] Añadir rollback/reverse.
- [ ] Tests de multi-moneda.
- [ ] Tests de concurrencia básica.

## Criterio de aceptación

El flujo de JEC Spliit termina efectivamente cuando las cuentas quedan saldadas.

---

# 11. Fase 7 — Quick Add de gastos con Base UI Drawer

## Objetivo

Reducir drásticamente el tiempo necesario para registrar un gasto frecuente.

## FAB

Cambiar inicialmente:

```text
+
```

por:

```text
+ Gasto
```

En mobile puede contraerse a icono al hacer scroll sólo si se implementa sin afectar accesibilidad.

## Interacción

Al pulsar `+ Gasto` desde Summary o Expenses:

abrir Base UI Drawer con:

```text
Nuevo gasto

Descripción
[ Cena             ]

Monto
[ $ 45.000         ]

Pagó
[ Javier         v ]

[Guardar gasto]

Más opciones
```

## `Más opciones`

Puede expandir o navegar al formulario completo con:

- fecha;
- categoría;
- participantes;
- split personalizado;
- moneda;
- notas;
- adjuntos si existen.

## Reglas

- [ ] No duplicar la lógica de validación del formulario completo.
- [ ] Extraer schema y mutation compartidos.
- [ ] Mantener URL `/expenses/create` como fallback y deep link.
- [ ] Drawer debe respetar teclado virtual móvil.
- [ ] Focus inicial inteligente: descripción o monto según test UX.
- [ ] Después de guardar: cerrar drawer y actualizar lista/summary optimísticamente.

## Feedback

Toast recomendado:

```text
✓ Cena agregada · $45.000
Tu parte: $11.250
[Deshacer]
```

## Criterio de aceptación

Un gasto simple se puede registrar sin abandonar la pantalla actual.

---

# 12. Fase 8 — Lista de gastos más escaneable

## Objetivo

Poder comprender muchos gastos con menos lectura.

## Diseño orientativo

```text
🍔  Cena del viernes                         $48.200
    Juli pagó · ayer
    Tu parte: $12.050
```

## Tareas

- [ ] Mostrar categoría con icono coherente.
- [ ] Resaltar monto total.
- [ ] Mostrar pagador.
- [ ] Mostrar fecha relativa cuando sea útil.
- [ ] Mostrar `Tu parte` cuando el usuario está asociado a un participante.
- [ ] Mantener accesible el detalle completo.
- [ ] Reducir borders innecesarios.
- [ ] Añadir búsqueda cuando el grupo tenga suficiente volumen.
- [ ] Añadir filtros con progressive disclosure.

## Filtros sugeridos

- Todos.
- Míos.
- Pagados por mí.
- Categoría.
- Participante.
- Rango de fecha.

No mostrar una barra de filtros compleja permanentemente en grupos pequeños.

## Criterio de aceptación

La lista se puede recorrer visualmente identificando montos, categoría y responsabilidad sin abrir cada gasto.

---

# 13. Fase 9 — Categorías visuales

## Objetivo

Mejorar reconocimiento visual y análisis.

## Categorías iniciales sugeridas

- Comida.
- Transporte.
- Alojamiento.
- Supermercado/compras.
- Actividades.
- Servicios.
- Salud.
- Otros.

## Reglas

- [ ] Mantener el icono como ayuda, no como única señal.
- [ ] No depender solamente del color.
- [ ] Permitir categoría vacía / Otros.
- [ ] Mantener traducciones en `next-intl`.

## Criterio de aceptación

Las categorías mejoran el escaneo sin agregar pasos obligatorios al Quick Add.

---

# 14. Fase 10 — Actividad del grupo

## Objetivo

Dar trazabilidad cuando varias personas editan el mismo grupo.

## Ejemplos

```text
Juli agregó Cena · $48.200
Nico agregó Nafta · $36.900
Ana editó Supermercado
Tomi pagó $15.680 a Ana
```

## Tareas

- [ ] Definir eventos relevantes.
- [ ] Evitar loguear ruido técnico.
- [ ] Mostrar actividad reciente en Summary.
- [ ] Permitir abrir el recurso relacionado.
- [ ] Considerar paginación sólo si realmente es necesaria.

## Criterio de aceptación

Ante un cambio inesperado, el grupo puede comprender qué ocurrió sin preguntar externamente.

---

# 15. Fase 11 — Ciclo de vida del grupo

## Objetivo

Reemplazar la noción técnica de `archivado` por un concepto de uso real.

## Estados UX

- Activo.
- Saldado.
- Finalizado.

`Saldado` puede derivarse de balances = 0.

`Finalizado` puede seguir utilizando internamente la infraestructura actual de archive si no es necesario modificar el schema.

## Flujo sugerido

Cuando todos los balances llegan a cero:

```text
🎉 Todos están a mano

¿Finalizar este grupo?
[Ahora no] [Finalizar grupo]
```

## Pantalla `/groups`

Separar:

```text
Activos
...

Finalizados
...
```

Los grupos fijados pueden vivir arriba de Activos sin convertirse en una tercera jerarquía visual dominante.

## Criterio de aceptación

El lenguaje de la aplicación describe el ciclo real de una cuenta compartida.

---

# 16. Fase 12 — Landing y onboarding

## Objetivo

Explicar el producto y reducir fricción antes del login.

## Mantener

La preview actual del viaje y balances es útil y debe conservarse o evolucionar, no eliminarse.

## Mejoras

### CTA

Evitar dos botones que terminen conceptualmente en el mismo login.

Propuesta:

```text
[Comenzar gratis]
[Ver cómo funciona]
```

`Ver cómo funciona` hace scroll.

### Sección de tres pasos

```text
1. Creá un grupo
2. Carguen los gastos
3. Saldá las cuentas
```

### Autenticación

Solicitar Google cuando el usuario necesita persistir/crear el grupo, no antes de que comprenda el producto.

## Criterio de aceptación

Una persona nueva puede explicar qué hace JEC Spliit después de recorrer una sola pantalla.

---

# 17. Fase 13 — Gestos y shortcuts móviles

## Objetivo

Añadir velocidad para usuarios frecuentes sin ocultar funciones esenciales.

## Posibles gestos

- swipe en gasto → editar;
- swipe alternativo → eliminar;
- swipe en settlement → marcar pagado.

## Regla de accesibilidad

Nunca hacer que una función exista únicamente mediante gesto.

Siempre debe existir una alternativa visible/menu.

## Decisión

Esta fase es P2/P3. Implementarla sólo después de estabilizar Quick Add y settlements.

---

# 18. Fase 14 — Limpieza de dependencias UI

## Objetivo

Eliminar el stack anterior sólo cuando la migración haya terminado.

## Tareas

- [ ] Buscar todos los imports `@radix-ui/*`.
- [ ] Eliminar cada paquete Radix sin usos.
- [ ] Eliminar `vaul` si Drawer ya fue migrado y no existen consumidores.
- [ ] Revisar `cmdk` caso por caso.
- [ ] Revisar `@material/web` y eliminar si sólo pertenecía a experimentos no necesarios.
- [ ] Revisar `components.json` si continúa aportando valor.
- [ ] Regenerar `bun.lock`.
- [ ] Comprobar bundle size antes/después.

No perseguir “cero dependencias UI” como objetivo artificial. Mantener una librería especializada si aporta valor real.

## Criterio de aceptación

No quedan paquetes legacy sin consumidores y el bundle no carga dos implementaciones del mismo primitive sin necesidad.

---

# 19. Fase 15 — Accesibilidad, performance y QA final

## Accesibilidad

- [ ] Navegación completa con teclado.
- [ ] Orden de tabulación coherente.
- [ ] Focus visible.
- [ ] Escape cierra overlays cuando corresponde.
- [ ] Focus retorna al trigger.
- [ ] Labels explícitos en campos.
- [ ] Errores asociados a inputs.
- [ ] Contraste WCAG AA.
- [ ] Touch targets adecuados.
- [ ] `prefers-reduced-motion`.
- [ ] No depender solamente de color/icono.

## Mobile/PWA

Probar al menos:

- viewport pequeño Android;
- viewport grande Android;
- iPhone con safe-area;
- standalone PWA;
- teclado abierto dentro de Drawer;
- landscape básico.

## Performance

- [ ] Mantener prefetch por intención actual.
- [ ] Evitar waterfalls nuevos.
- [ ] Evitar N+1 en `/groups`.
- [ ] Optimistic updates para acciones frecuentes.
- [ ] Skeletons que reflejen layout final.
- [ ] Medir bundle antes/después.
- [ ] Evitar hidratar componentes que pueden seguir siendo server components.

## QA

Por cada fase:

```bash
bun run lint
bun run check-types
bun test
bun run build
```

Además realizar smoke test móvil de creación de gasto y settlement.

---

# 20. Prioridad resumida

## P0 — Primero

1. Baseline y tests.
2. Base UI + design tokens.
3. Migración de primitives fundamentales.
4. `/groups` con información financiera útil.
5. Dashboard del grupo.
6. `Quién paga a quién`.
7. Settlements / marcar como pagado.

## P1 — Alto impacto

8. Quick Add con Drawer.
9. `Tu parte` en gastos.
10. Categorías visuales.
11. Actividad reciente.
12. Estados Activo / Saldado / Finalizado.

## P2 — Refinamiento

13. Búsqueda y filtros adaptativos.
14. Simplificación visual de superficies.
15. Landing/onboarding.
16. Gestos móviles.

## P3 — Cleanup

17. Eliminar Radix/Vaul/Material no utilizados.
18. Bundle audit.
19. QA amplio y documentación final.

---

# 21. Orden de PRs recomendado

Para evitar un PR gigantesco:

### PR 1 — Base UI foundation

- dependencia;
- root/portal setup;
- tokens;
- convenciones de wrappers.

### PR 2 — Low-risk primitives

- Tooltip;
- Popover;
- Collapsible;
- Checkbox/Radio.

### PR 3 — Overlay primitives

- Dropdown Menu;
- Dialog;
- Select.

### PR 4 — Drawer + mobile primitive foundation

- Base UI Drawer;
- keyboard/safe area tests.

### PR 5 — Groups dashboard cards

- nuevo diseño `/groups`;
- API agregada necesaria.

### PR 6 — Group summary dashboard

- total;
- mi saldo;
- últimos gastos;
- deuda resumida.

### PR 7 — Debt simplification UX

- pagos sugeridos;
- balances individuales secundarios;
- tests algoritmo.

### PR 8 — Settlements

- schema/API;
- UI;
- mutation;
- undo/reverse si corresponde.

### PR 9 — Quick Add

- Drawer;
- shared validation;
- optimistic update.

### PR 10 — Expense list polish

- categorías;
- tu parte;
- filtros progresivos.

### PR 11 — Activity + group lifecycle

- feed;
- saldado;
- finalizado.

### PR 12 — Landing + polish

- CTA;
- onboarding;
- visual cleanup.

### PR 13 — Legacy UI cleanup

- eliminar dependencias sin uso;
- bundle audit;
- documentación.

---

# 22. Archivos de alto impacto ya identificados

```text
src/app/page.tsx
src/app/globals.css
src/app/layout.tsx

src/app/groups/recent-group-list.tsx
src/app/groups/recent-group-list-card.tsx

src/app/groups/[groupId]/layout.client.tsx
src/app/groups/[groupId]/balances-list.tsx
src/app/groups/[groupId]/summary/*
src/app/groups/[groupId]/expenses/*

src/components/ui/*

src/trpc/*
prisma/*
```

Los paths exactos de Summary/Expenses deben confirmarse en cada fase antes de modificar, porque el código puede evolucionar mientras se implementa el roadmap.

---

# 23. Definition of Done global

La migración UI/UX se considera completa cuando:

- [ ] la aplicación usa Base UI como foundation principal de primitives;
- [ ] no quedan Radix/Vaul sin uso;
- [ ] `/groups` muestra estado financiero útil;
- [ ] Summary responde rápidamente cuánto se gastó y cuál es la situación personal;
- [ ] Balances muestra quién paga a quién;
- [ ] los usuarios pueden marcar pagos como realizados;
- [ ] crear un gasto simple es posible desde un Drawer móvil rápido;
- [ ] la lista de gastos muestra información personal relevante;
- [ ] un grupo puede pasar de activo a saldado/finalizado;
- [ ] desktop, mobile y PWA mantienen accesibilidad y navegación consistente;
- [ ] lint, typecheck, tests y build pasan;
- [ ] no existen regresiones importantes de performance.

---

# 24. Referencias Base UI

Documentación oficial:

- https://base-ui.com/
- https://base-ui.com/react/overview/quick-start
- https://base-ui.com/react/handbook/composition
- https://base-ui.com/react/overview/releases

La implementación debe consultar la documentación correspondiente al componente antes de migrarlo, especialmente para `render`, portals, focus management, Drawer y comportamiento móvil.
