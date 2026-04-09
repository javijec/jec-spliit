# Mobile App UI Guidelines

Estos lineamientos definen como debe sentirse y comportarse NexoGastos en mobile.
La idea es que cada pantalla se perciba como una app utilitaria, clara y compacta, no como una web adaptada.

## Objetivo

- Priorizar velocidad de lectura, accion y orientacion.
- Reducir scroll innecesario, especialmente en primeras pantallas.
- Mantener una estetica sobria, consistente y enfocada en tareas.
- Hacer que la app se sienta nativa en telefonos, incluyendo PWA standalone.

## Principios visuales

- Una pantalla, una accion principal.
- El primer viewport debe resolver orientacion y accion principal sin ruido.
- Menos secciones, menos repeticion, menos texto explicativo.
- El contenido importante debe pesar mas que el decorativo.
- Evitar aspecto de dashboard administrativo si la pantalla es de uso frecuente.

## Sistema de UI y tema

- La app debe sentirse como un sistema de producto, no como pantallas armadas por separado.
- Tomar como referencia la claridad y consistencia de Material, sin copiar su estetica de forma literal.
- Debe existir un lenguaje comun de:
  - colores
  - tipografia
  - radios
  - sombras
  - alturas de controles
  - espaciados
  - estados interactivos
- Cada componente reutilizable debe respetar siempre el mismo contrato visual.
- Si una decision de estilo cambia entre pantallas, debe justificarse por contexto real y no por improvisacion.

## Tema

- Definir tokens visuales claros para `background`, `foreground`, `muted`, `border`, `primary`, `secondary`, `destructive` y `accent`.
- El color primario debe reservarse para accion, foco y seleccion, no para decorar toda la pantalla.
- Los colores de apoyo deben usarse para jerarquia y estado, no para sumar ruido.
- El contraste debe ser alto en texto, bordes importantes y botones primarios.
- El modo oscuro, si existe, debe conservar la misma jerarquia y no solo invertir colores.
- Los estados `hover`, `active`, `focus-visible`, `disabled` y `selected` deben verse coherentes en todos los componentes.

## Componentes base

- Botones, inputs, selects, dialogs, drawers, tabs y cards deben compartir misma familia visual.
- Los botones primarios deben verse claramente mas importantes que los secundarios y terciarios.
- Los inputs deben tener altura, padding y borde consistentes en toda la app.
- Los drawers y dialogs deben sentirse parte del mismo sistema de capas.
- Los chips, badges y etiquetas deben ser discretos y funcionales.
- Los iconos deben acompañar la accion, no reemplazar texto cuando eso empeora comprension.

## Material de referencia

- Usar Material como referencia en consistencia, estados y sistema de componentes.
- Priorizar:
  - jerarquia clara
  - targets tactiles comodos
  - feedback visual inmediato
  - navegacion simple
  - superficies bien diferenciadas
- Evitar:
  - exceso de elevacion
  - saturacion de color
  - demasiados componentes compitiendo en un mismo bloque
  - interfaces que parezcan demo de libreria

## Tokens recomendados

- Estos tokens sirven como base para implementar el tema de la app:

```txt
color.background.app
color.background.surface
color.background.elevated
color.foreground.primary
color.foreground.secondary
color.foreground.muted
color.border.subtle
color.border.strong
color.brand.primary
color.brand.primary-foreground
color.state.success
color.state.warning
color.state.destructive
color.state.info
```

- Escala de radios sugerida:

```txt
radius.sm = 10px
radius.md = 14px
radius.lg = 18px
radius.xl = 24px
radius.full = 9999px
```

- Escala de espaciado sugerida:

```txt
space.1 = 4px
space.2 = 8px
space.3 = 12px
space.4 = 16px
space.5 = 20px
space.6 = 24px
space.8 = 32px
space.10 = 40px
```

- Alturas de controles sugeridas:

```txt
control.sm = 36px
control.md = 44px
control.lg = 52px
```

- Sombras sugeridas:

```txt
shadow.rest = sombra suave, corta y difusa
shadow.raised = un nivel mas marcada, nunca dramatica
shadow.overlay = reservada para dialog, drawer y elementos flotantes
```

## Reglas de implementacion

- No definir colores sueltos dentro de componentes si ya existe un token que resuelve el caso.
- No crear una variante visual nueva para un solo uso sin antes revisar si entra en el sistema actual.
- Si un componente necesita una excepcion visual, esa excepcion debe ser chica y documentada.
- Los componentes compartidos deben resolverse desde `ui/` o una capa comun, no duplicados por pantalla.
- El responsive mobile no debe depender de esconder problemas visuales con `sm:` sino de una base mobile correcta.

## Checklist de unificacion de componentes

- `Button`
  - tamaños consistentes
  - variantes primaria, secundaria, ghost y destructiva bien separadas
  - icono con alineacion y gap consistentes
  - foco visible claro
- `Input` y `Textarea`
  - misma altura base
  - mismos bordes, fondo y placeholder
  - estado error unificado
- `Select`, `Combobox` y `CurrencySelector`
  - misma altura visual que inputs
  - mismo borde y radio
  - mismo comportamiento de foco
- `Card`
  - padding consistente
  - borde y sombra segun jerarquia
  - no mezclar cards planas y cards muy elevadas sin razon
- `Dialog` y `Drawer`
  - mismo lenguaje de capas
  - header, body y footer consistentes
  - scroll interno y safe areas resueltos
- `Badge` y `Chip`
  - tipografia pequena pero legible
  - uso funcional, no decorativo
- `List rows`
  - targets tactiles comodos
  - feedback claro al tocar
  - acciones laterales sin robar protagonismo

## Orden recomendado para continuar la UI

1. Unificar tokens y variantes base de `Button`, `Input`, `Card`, `Badge`, `Dialog` y `Drawer`.
2. Ajustar `/groups`, `/groups/create` y `/account` para que usen esas mismas reglas.
3. Revisar la vista interna de grupo con el mismo sistema.
4. Recién despues pulir detalles decorativos o microinteracciones.

## Jerarquia

- El titulo debe explicar inmediatamente donde esta el usuario.
- La accion principal debe ser unica o claramente dominante.
- Las acciones secundarias deben quedar visualmente por debajo de la principal.
- No repetir la misma CTA en hero, empty state y footer del mismo viewport.
- Si una pantalla ya tiene un bloque superior fuerte, el empty state debajo debe ser breve.

## Layout mobile

- Disenar para `390x844` como viewport de referencia.
- Evitar contenido que obligue a scrollear cuando la pantalla esta vacia o tiene poco contenido.
- El header fijo siempre debe descontarse del alto disponible.
- Usar safe areas (`env(safe-area-inset-top|bottom)`) en header, bottom nav, drawers y dialogs.
- Evitar scroll fantasma: el alto visible debe coincidir con el alto del documento cuando el contenido es corto.

## Navegacion

- Usar `Link` real para navegacion siempre que sea posible.
- Evitar `div` o `button` que navegan con `router.push()` para filas completas.
- Si una accion requiere autenticacion, el texto y el destino deben reflejarlo:
  - deslogueado: `Ingresar con Google`
  - logueado: accion de producto real, por ejemplo `Ir a grupos`
- No ofrecer accesos visibles a rutas que el usuario no deberia usar en ese estado.

## Acciones

- En mobile debe haber una sola CTA principal por bloque importante.
- Botones de icono deben tener `aria-label` y `title`.
- Acciones secundarias como importar, compartir o agregar por URL deben usar drawer/sheet en mobile.
- Popovers deben reservarse para desktop salvo casos muy puntuales.

## Superficies

- Preferir bloques con borde suave, fondo limpio y sombra liviana.
- Evitar mosaicos de cards si una lista o una sola superficie resuelve mejor la tarea.
- Las cards deben tener presencia, pero no parecer widgets decorativos.
- Las listas principales deben sentirse tactiles y directas.

## Empty states

- Un empty state debe responder:
  - que pasa
  - que hacer ahora
- No repetir el nombre de la pantalla si ya esta en el header.
- No duplicar CTAs ya visibles arriba.
- El tono debe ser directo y corto.

## Formularios

- Reducir densidad vertical al minimo razonable.
- Encabezado corto, contexto breve, formulario rapido de escanear.
- Inputs importantes primero.
- Ayuda contextual solo donde desbloquea una decision.
- En mobile, los dialogs y drawers deben:
  - tener altura maxima
  - permitir scroll interno
  - respetar safe areas
  - comportarse bien con teclado abierto

## Listas de grupos

- El nombre del grupo debe ser la informacion mas visible.
- La metadata debe presentarse como chips o etiquetas faciles de leer.
- Las acciones laterales no deben competir con el contenido principal.
- Evitar flechas decorativas si toda la card ya comunica navegacion.

## Home

- La home debe ser corta y enfocada.
- Si el usuario no esta logueado, la accion principal debe ser login.
- No usar mas de una CTA principal en la home.
- No agregar secciones repetitivas que vuelvan a explicar lo mismo.

## Cuenta

- Si el usuario no esta logueado, la pantalla de cuenta debe limitarse a explicar eso y ofrecer login.
- No mostrar accesos de producto inconsistentes con el estado de sesion.

## Tono visual

- Sobrio, claro, utilitario, moderno.
- Nada de “landing genérica”.
- Nada de exceso de gradientes, cards apiladas o micro-copy de marketing.
- La UI debe transmitir control, calma y rapidez.

## Checklist antes de cerrar una pantalla

- Se entiende la pantalla en menos de 3 segundos.
- La accion principal es obvia.
- No hay scroll extra con contenido corto.
- El header fijo no genera alto sobrante.
- Empty state sin repeticion.
- Mobile usa drawer en lugar de popover cuando corresponde.
- Los botones solo-icono tienen etiqueta accesible.
- El estado logueado/deslogueado cambia texto y destinos correctamente.
