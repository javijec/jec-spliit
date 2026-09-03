# JEC Spliit UI Baseline Inventory

This is the Phase 0 baseline for the UI/UX and Base UI migration roadmap. It records the current implementation without changing the design system, installing Base UI, or migrating a primitive.

> **Evidence rule:** facts below come from the current checkout at `3b08a6971e24ed0db8d04442f234c71a25a23ca9`, static source inspection, and the command results recorded in this document. Anything that needs a browser, authenticated data, or iOS/PWA runtime is explicitly marked `UNKNOWN / NEEDS LIVE VERIFICATION`.

## 1. Baseline

| Field | Value |
|---|---|
| Branch | `main` |
| Starting SHA | `3b08a6971e24ed0db8d04442f234c71a25a23ca9` |
| Remote at start | `origin/main` matched the expected SHA after `git fetch origin` |
| Date | 2026-09-02 |
| Runtime | Next.js `16.1.6`, React `19.2.4`, TypeScript `5.9.3`, Bun `1.3.14` |
| Styling | Tailwind CSS 3, CSS variables, `tailwindcss-animate`, `@tailwindcss/typography` |
| Data/API | Prisma 6, tRPC 11 RC, React Query 5 |
| Test runner | Jest 29 + `jest-environment-jsdom` + Testing Library React 16 |
| Browser E2E | No `playwright.config.*`, E2E script, or Playwright dependency declared in `package.json` |
| Local changes before Phase 0 | Untracked `.atl/` existed and was left untouched |
| CodeGraph | `.codegraph/` was initialized locally for repository inspection; it is not part of this phase's commit |

### Quality-gate baseline

| Command | Result |
|---|---|
| `bun install` | **BLOCKED**: resolved/downloaded packages but did not complete; interrupted after ~90 seconds |
| `bun run lint` | **RED / ENVIRONMENT**: `eslint` was unavailable before the partial install |
| `bun run check-types` | **RED**: generated Prisma client was incomplete; representative errors include missing `SplitMode`, `Category`, `PrismaClient`, and `Participant` exports, plus cascading implicit-`any` errors |
| `bun test` | **RED / ENVIRONMENT**: partial dependency tree could not resolve `ci-info/vendors.json` and `exit` |

`bun.lock` was not modified. The current repository already has a lockfile mismatch: `package.json` declares `@material/web`, while the root dependency section of `bun.lock` does not. `bun install --frozen-lockfile` therefore reports that the lockfile would change. This is recorded as a pre-existing setup issue, not fixed in Phase 0.

## 2. Route inventory

The following App Router routes exist in `src/app`. Dynamic segments are shown with angle brackets only for readability.

| Route | Current implementation | Critical data/actions | Overlay or navigation surface |
|---|---|---|---|
| `/` | `src/app/page.tsx` landing | Reads current auth session; links to groups or Google login | Global fixed header; no local overlay |
| `/groups` | `recent-group-list.tsx` and `recent-group-list-card.tsx` | `viewer.getCurrent`, aggregated `groups.mine` financial summaries, legacy local-group sync; star/archive/remove membership mutations | Financial group cards with deterministic avatar, localized activity, currency-separated balance, and context menu |
| `/groups/create` | `create/create-group.tsx` | Auth gate when enabled; creates a group and owner/active participant | Group form Select and participant Hover Card |
| `/groups/<groupId>` | `page.tsx` redirect | Redirects to `/summary` | None |
| `/groups/<groupId>/summary` | `summary/page.client.tsx` inside group layout | Group context, group details, participant/link status; links to Expenses, Balances, Settings | Global active-user Dialog/Drawer; mobile FAB and bottom navigation |
| `/groups/<groupId>/expenses` | `expenses/page.client.tsx` and `expense-list.tsx` | Infinite `groups.expenses.list` query; opens edit links; create link | Mobile FAB; expense cards can show contextual actions |
| `/groups/<groupId>/expenses/create` | `create/create-expense-modal.tsx` and expense form | Categories, currency, payer, split mode, participants, documents; create mutation | Mobile/desktop expense flow; Select, Checkbox, Collapsible, category/currency Popover or Drawer |
| `/groups/<groupId>/expenses/<expenseId>/edit` | `edit-expense-form.tsx` inside `ExpenseFlowShell` | Loads and updates an expense | Expense flow shell; form overlays |
| `/groups/<groupId>/balances` | `balances/balances-and-reimbursements.tsx` | `groups.balances.list`; individual balances and reimbursements | Payment Dialog for total/partial reimbursement |
| `/groups/<groupId>/settings` | `settings/page.client.tsx` | Member/participant management, group edits, invite, export, delete/leave semantics | Several Dialogs; Checkbox; Dropdown export |
| `/groups/<groupId>/information` | `information/page.tsx` | Redirects to `/settings` | None |
| `/groups/<groupId>/edit` | `edit/edit-group.tsx` | Edit group form | Group form controls |
| `/groups/<groupId>/stats` | `stats/page.tsx` | Redirects to `/summary` | None |
| `/account` | `account/page.tsx` and profile shell/form | Auth session and current user; profile update/delete/logout | Account Dialogs and Collapsible sections |
| `/invite/<inviteId>` | `invite/<inviteId>/page.tsx` | Loads and accepts invite; auth redirect; then redirects to group summary | None in success path; error/expired states are inline |
| `/material-lab` | `material-lab/page.tsx` and `material-lab-demo.tsx` | Visual experiment only; local component state | Native Material Web custom elements |
| `/unlock/<groupId>` | `unlock/<groupId>/page.tsx` | Redirects to group summary | None |

The requested `/groups/<groupId>/information` route exists, but it is not a second screen: it redirects to Settings. No route was invented for a missing feature.

## 3. UI dependency inventory

| Package | Real source usage | Local boundary | Approx. source references | Criticality | Migration complexity | Base UI direction / notes |
|---|---|---|---:|---|---|---|
| `@radix-ui/react-dialog` | **Phase 0 historical usage; removed in Phase 2D** | `src/components/ui/dialog.tsx` | 0 real source imports | High | High | Replaced by Base UI `Dialog`; local wrapper preserves controlled state, focus return, Escape, outside press, and portal behavior |
| `@radix-ui/react-dropdown-menu` | **Phase 0 historical usage; removed in Phase 2C** | `dropdown-menu.tsx` | 1 wrapper + 4 main consumers | High | Medium | Replaced by Base UI `Menu`; local wrapper and feature consumers remain |
| `@radix-ui/react-popover` | Category, currency, share controls | `popover.tsx` | 1 wrapper + 3 consumers | High | Medium | Base UI `Popover`; check positioner/portal and mobile fallback |
| `@radix-ui/react-select` | **Phase 0 historical usage; removed in Phase 2E** | `select.tsx` | 0 real source imports | High | High | Replaced by Base UI `Select`; local wrapper preserves string values, controlled/uncontrolled state, keyboard behavior, focus return, form names, and option positioning |
| `@radix-ui/react-checkbox` | Settings and expense participant selection | `checkbox.tsx` | 1 wrapper + 2 consumers | Medium | Medium | Base UI `Checkbox`; preserve form serialization and indeterminate behavior |
| `@radix-ui/react-collapsible` | Account sections and advanced expense options | `collapsible.tsx` | 1 wrapper + 2 consumers | Medium | Low | Base UI `Collapsible` |
| `@radix-ui/react-radio-group` | Active participant selection | `radio-group.tsx` | 1 wrapper + modal | High | Medium | Base UI `Radio`; preserve controlled value and disabled linked participants |
| `@radix-ui/react-tabs` | **Phase 0 historical usage; removed in Phase 2F** | `tabs.tsx` | 0 real source imports | Low / legacy candidate | Low | Replaced by Base UI `Tabs` behind the local wrapper; no production consumers; bottom navigation is route navigation, not Tabs |
| `@radix-ui/react-toast` | **Phase 0 historical usage; removed in Phase 2H** | `toast.tsx`, `toaster.tsx` | 0 real source imports | High | Medium | Replaced by Base UI `Toast`; the local imperative API and global viewport remain |
| `@radix-ui/react-hover-card` | **Phase 0 historical usage; removed in Phase 2H** | `hover-card.tsx` | 0 real source imports | Medium | Medium | Replaced by Base UI `Preview Card`; it remains a non-modal pointer/keyboard visual preview with no invented touch semantics |
| `@radix-ui/react-label` | Form and Label wrappers | `label.tsx`, `form.tsx` | 2 wrappers | Medium | Low | Base UI `Field`/native label strategy; do not change form semantics in Phase 0 |
| `@radix-ui/react-slot` | Button and Form composition | `button.tsx`, `form.tsx` | 2 wrappers; ~50 `asChild` references | Very high | High | Base UI `render` composition; this is a migration seam, not changed here |
| `@radix-ui/react-icons` | Theme and starred-group icons | Direct imports | 2 consumers | Low | Low | Not a primitive migration blocker; keep until icon policy is decided |
| `vaul` | **Phase 0 historical usage; removed in Phase 2G** | `src/components/ui/drawer.tsx` | 0 real source imports | High on mobile | High | Replaced by Base UI `Drawer`; local wrapper preserves the bottom sheet API, gestures, focus, scroll, safe-area, and keyboard behavior |
| `cmdk` | **Phase 0 historical usage; removed in Phase 2E**; no command palette consumer existed | `combobox.tsx` | 0 real source imports | Medium | Medium/High | Replaced by Base UI `Combobox` for category and currency search; no generic command-palette replacement introduced |
| `@material/web` | Nine custom-element imports in Material Lab | Direct imports from `material-lab-demo.tsx` | 10 references | None in production flows | Low cleanup / high visual verification | Lab-only unless live routing shows otherwise; do not delete now |
| `lucide-react` | Icons across landing, group, expense, settings, and UI wrappers | Direct imports | ~48 source references | Medium | Low | Keep; unrelated to Base UI primitive replacement |
| `class-variance-authority` | Alert, Badge, Button, Label, Toast variants | Direct imports in UI wrappers | 5 files | Medium | Low | Keep as styling utility unless a later design-system decision changes it |
| `tailwindcss-animate` | Tailwind plugin in `tailwind.config.js` | Tailwind config | 0 source imports; 1 plugin registration | Medium | Low | Keep during migration; Radix state animation classes depend on the plugin |

The exact Base UI component names above were checked against the current official component documentation: `Dialog`, `Menu`, `Popover`, `Select`, `Checkbox`, `Collapsible`, `Radio`, `Toast`, `Preview Card`, `Drawer`, and `Combobox`. APIs were not copied or implemented in this phase. See [Base UI Dialog](https://base-ui.com/react/components/dialog), [Menu](https://base-ui.com/react/components/menu), [Drawer](https://base-ui.com/react/components/drawer), and [Combobox](https://base-ui.com/react/components/combobox).

## 4. `src/components/ui` matrix

`Focus` and controlled/uncontrolled columns describe behavior visible from the wrapper API/source. Runtime focus-loop and browser-specific behavior remain `UNKNOWN / NEEDS LIVE VERIFICATION` unless covered by the smoke tests below.

| File | Class | Dependency | Main consumers | `asChild` | Portal | Focus/state | Mobile risk | Probable Base UI destination | Phase |
|---|---|---|---|---|---|---|---|---|---|
| `alert.tsx` | B visual | Own + CVA | Expense form | No | No | Static | Low | Own visual component | N/A |
| `badge.tsx` | B visual | Own + CVA | Group, summary, expenses, settings | No | No | Static | Low | Own visual component | N/A |
| `button.tsx` | A boundary | Radix Slot + CVA | Broad app-wide usage | Yes | No | Native button or Slot | High | Own Button adapted to `render` | 1/2D foundation |
| `card.tsx` | F surface | Own | Forms and feedback | No | No | Static | Low | Own surface | N/A |
| `carousel.tsx` | B visual | Own | Expense documents | No | No | Local carousel state | Medium | Own component | N/A |
| `checkbox.tsx` | A form primitive | Radix Checkbox | Settings, expense form | No | No | Controlled or uncontrolled Radix state | Medium | Base UI Checkbox | 2B |
| `collapsible.tsx` | A headless wrapper | Radix Collapsible | Account, advanced expense options | No | No | Controlled/uncontrolled primitive state | Medium | Base UI Collapsible | 2A |
| `command.tsx` | Removed in Phase 2E | cmdk | No consumers | No | N/A | N/A | Replaced by `combobox.tsx` | 2E complete |
| `dialog.tsx` | A overlay wrapper | Base UI Dialog | Account, settings, reimbursements, active user, documents | No | Yes | Controlled/uncontrolled; focus, Escape, outside press, portal, and scroll lock managed by Base UI | High | Base UI Dialog | 2D complete |
| `drawer.tsx` | A overlay wrapper | Base UI Drawer | Active user, share, currency, category | Yes through primitives | Yes | Controlled/uncontrolled; gesture/focus managed by Base UI | Very high | Base UI Drawer | 2G complete |
| `dropdown-menu.tsx` | A overlay wrapper | Base UI Menu | Group cards, export, locale, theme | Trigger and item adapters | Yes | Keyboard navigation, focus return, menu state | High | Base UI Menu | 2C complete |
| `empty-state.tsx` | B visual | Own | Expenses, balances, reimbursements | No | No | Static | Low | Own visual component | N/A |
| `form.tsx` | C form support | Radix Label + Slot | Group and expense forms | Via Slot | No | React Hook Form integration | High | Base UI Field/Form boundary, later | 2B/2E |
| `group-section-card.tsx` | F surface/layout | Own | Most top-level sections | No | No | Static | Low | Own surface | N/A |
| `hover-card.tsx` | A overlay wrapper | Base UI Preview Card | Group form | Trigger `render` composition | Yes | Hover/focus preview state | High on touch | Base UI Preview Card | 2H complete |
| `input.tsx` | C form control | Own | Account, group, expense, share | No | No | Native input | Medium | Own input / Base UI Field composition | 2B |
| `label.tsx` | C form support | Radix Label | Form and active-user modal | No | No | Native label association | Low | Base UI Field label or native label | 2B |
| `page-container.tsx` | F layout | Own | Account, groups, material lab | No | No | Static | Low | Own layout | N/A |
| `page-header.tsx` | E navigation/layout | Own | Account, groups, balances, settings | No | No | Static | Low | Own layout | N/A |
| `popover.tsx` | A overlay wrapper | Radix Popover | Category, currency, share | Trigger API | Yes | Controlled in selectors | High on mobile; drawer fallback | Base UI Popover | 2A |
| `radio-group.tsx` | A form primitive | Radix Radio Group | Active user modal | No | No | Controlled value in modal | High | Base UI Radio | 2B |
| `search-bar.tsx` | G legacy candidate | Own | No consumer found | No | No | Local input state | Unknown | Keep until removal is verified | N/A |
| `select.tsx` | A form primitive | Base UI Select | Group and expense forms | No | Yes | Default/controlled value; keyboard state; form serialization | High | Base UI Select | 2E complete |
| `combobox.tsx` | A composite form primitive | Base UI Combobox | CategorySelector, CurrencySelector | No | No | Inline filtering, controlled selection, keyboard state | High | Base UI Combobox | 2E complete |
| `skeleton.tsx` | B feedback visual | Own | Loading states across routes | No | No | Static | Low | Own visual component | N/A |
| `table.tsx` | G legacy candidate | Own | No consumer found | No | No | Static | Unknown | Keep until removal is verified | N/A |
| `tabs.tsx` | G legacy candidate | Base UI Tabs | No current production consumers | No | No | Controlled/uncontrolled state, orientation, keyboard focus, active/disabled state | Medium | Base UI Tabs | 2F complete |
| `textarea.tsx` | C form control | Own | Group form | No | No | Native textarea | Medium | Own textarea / Base UI Field composition | 2B |
| `toast.tsx` | D feedback overlay | Base UI Toast + CVA | Global toaster and upload feedback | No | Base UI Portal + Viewport | Singleton manager; focus, live region, timeout, and stack state managed by Base UI | High; `z-[100]` | Base UI Toast | 2H complete |
| `toaster.tsx` | D feedback support | Local composition over Base UI | Root layout | No | Through Base UI Toast Portal/Viewport | Renders the reactive singleton manager list | High | Own composition over Base UI Toast | 2H complete |

No `src/components/ui/tooltip.tsx` exists and no Tooltip package/import was found. This is a concrete difference from the roadmap's future component list, not a missing row to invent.

### Phase 2A update

The Phase 0 statement above is historical. Phase 2A added `src/components/ui/tooltip.tsx` as a Base UI wrapper even though no production consumer currently exists. The Popover and Collapsible wrappers were migrated in place; their existing feature imports remain local and their Radix packages were removed only after the global import check returned zero real imports. Phase 2B subsequently migrated Checkbox and Radio Group with the same local-wrapper boundary; Switch has no wrapper or production consumer.

### Phase 2C update

The Phase 0 row for `@radix-ui/react-dropdown-menu` is historical. Phase 2C migrated `src/components/ui/dropdown-menu.tsx` to Base UI `Menu` and removed the package after the source import check returned zero real imports. The wrapper preserves all existing local exports, adapts `asChild` to `render`, keeps portal/positioning internals hidden from features, and covers group-card/export/locale/theme consumers without direct Base UI imports. Jest covers the wrapper's keyboard dismissal/focus return, disabled and destructive items, checkbox/radio items, submenu, and `asChild` link composition. Browser viewport verification remains unknown because this checkout has no reproducible authenticated E2E harness.

### Phase 2D update

The Phase 0 row for `@radix-ui/react-dialog` is historical. Phase 2D migrated `src/components/ui/dialog.tsx` to Base UI `Dialog`, removed the direct package after the source import check returned zero real imports, and kept `Dialog`, `DialogTrigger`, `DialogPortal`, `DialogOverlay`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`, and `DialogClose` as the local feature-facing API. `DialogTrigger asChild` and `DialogClose asChild` adapt to Base UI `render`; `DialogContent` owns the portal/backdrop/viewport/popup composition. Focus, Escape, outside press, controlled state, explicit close, title/description, and scroll lock are covered by Jest. Authenticated consumer and real mobile/browser verification remain unknown.

### Phase 2E update

The Phase 0 rows for `@radix-ui/react-select` and `cmdk` are historical. Phase 2E migrated `src/components/ui/select.tsx` to Base UI `Select` and added the reusable `src/components/ui/combobox.tsx` boundary for the searchable category and currency selectors. The feature-facing API remains local: group and expense forms still use string-valued Selects, while CategorySelector and CurrencySelector retain desktop Popover and the local mobile Drawer composition. Base UI `Collection` is used for grouped filtering, and Select consumers receive `items` so displayed values resolve to their labels.

No command palette consumer existed, so `cmdk` and `src/components/ui/command.tsx` were removed. `vaul` was intentionally kept until the Drawer migration in Phase 2G. Focused Jest coverage now exercises Select opening, selection, controlled state, disabled options, Escape, focus return, Combobox filtering, selection, no-results, and Escape propagation to the surrounding overlay. Browser viewport, authenticated consumer, and real mobile Drawer verification remain unknown.

### Phase 2F update

The Phase 0 row for `@radix-ui/react-tabs` is historical. Phase 2F migrated `src/components/ui/tabs.tsx` to Base UI `Tabs.Root`, `Tabs.List`, `Tabs.Tab`, and `Tabs.Panel` while preserving the local `Tabs`, `TabsList`, `TabsTrigger`, and `TabsContent` exports. No current production consumers were found, so the wrapper was migrated for roadmap consistency only and no feature was invented. `TabsList` defaults `activateOnFocus` to `true` to preserve Radix's previous automatic activation behavior; callers can opt into manual activation through the local list props. Focused Jest coverage exercises default and controlled state, click switching, disabled tabs, horizontal/vertical arrows, Home/End, and tab/panel ARIA associations. The bottom navigation was not migrated and remains route-link navigation. `@radix-ui/react-tabs` was removed after the source import check returned zero real imports. Browser visual and authenticated consumer verification remain unknown.

### Phase 2G update

The Phase 0 `vaul` row is historical. Phase 2G migrated `src/components/ui/drawer.tsx` to Base UI Drawer and removed
`vaul` from `package.json` and `bun.lock` after confirming zero real source imports. The local exports remain `Drawer`,
`DrawerTrigger`, `DrawerPortal`, `DrawerClose`, `DrawerOverlay`, `DrawerContent`, `DrawerHeader`, `DrawerFooter`,
`DrawerTitle`, and `DrawerDescription`; feature files continue importing only this boundary. Real consumers are
CategorySelector, CurrencySelector, ActiveUserModal, and ShareButton. The wrapper preserves controlled/uncontrolled
state, `asChild` composition through Base UI `render`, bottom-sheet sizing and safe-area styles, internal scroll,
Escape/backdrop/Close dismissal, focus return, and swipe gestures; `VirtualKeyboardProvider` covers mobile form fields.
Jest covers the wrapper contract plus mobile CategorySelector/CurrencySelector opening, selection, and closing.
Authenticated browser verification of gesture physics, scroll locking, mobile keyboard behavior, safe areas, nested
overlays, and ActiveUserModal at `390x844` remains unknown.

### 2H — Toast / Hover Card cleanup

The Phase 0 rows for `@radix-ui/react-toast` and `@radix-ui/react-hover-card` are historical. Phase 2H migrated
`src/components/ui/toast.tsx`, `src/components/ui/toaster.tsx`, and `src/components/ui/use-toast.ts` to the current
Base UI Toast primitive. The local `useToast()` / `toast({...})` contract remains intact for all existing consumers;
the singleton Base UI manager carries titles, descriptions, default/destructive variants, actions, dismiss, the
existing five-second timeout semantics, and the one-toast limit. Base UI owns the live region, focus/viewport
landmark, portal, and stacking state. `@radix-ui/react-toast` was removed from `package.json` and `bun.lock` after
confirming zero real source imports.

The only production Hover Card consumer is the protected-participant explanation in `src/components/group-form.tsx`.
Phase 2H migrated `src/components/ui/hover-card.tsx` to Base UI `PreviewCard`, preserving the local exports,
`align`, `sideOffset`, className, and trigger composition. The consumer uses `render` so the disabled Button is the
actual trigger rather than an interactive element nested inside Preview Card's default anchor. Preview Card remains
a non-modal pointer/keyboard visual enhancement; no mobile tap or screen-reader primary flow was invented. Jest covers
imperative Toast rendering/action/dismiss/limit and Preview Card pointer hover, keyboard focus, and Escape.

Remaining direct Radix source imports are intentionally outside Phase 2H: `@radix-ui/react-label` in
`src/components/ui/form.tsx` and `src/components/ui/label.tsx`, `@radix-ui/react-slot` in
`src/components/ui/button.tsx` and `src/components/ui/form.tsx`, and `@radix-ui/react-icons` in
`src/components/theme-toggle.tsx` and `src/app/groups/recent-group-list-card.tsx`. The remaining legacy
interactive primitive boundary is therefore Label/Slot; icons remain a separate policy decision.
## 5. Radix usage

The Phase 0 inventory recorded 12 Radix primitive packages plus the icon package and Slot. After Phase 2H, 3 Radix-related packages remain in `package.json`: `@radix-ui/react-label`, `@radix-ui/react-slot`, and `@radix-ui/react-icons`. Label and Slot remain direct imports behind local wrappers; the icon package remains directly imported by two feature files. The highest-risk remaining boundary is Slot because it combines refs and composition behavior; icons remain a separate cleanup policy decision.

## 6. Vaul usage

`vaul` is now historical: Phase 2G migrated `src/components/ui/drawer.tsx` to Base UI Drawer and removed the package from `package.json` and `bun.lock` after confirming zero real source imports. The four existing consumers remain behind the local boundary:

- `src/app/groups/[groupId]/expenses/active-user-modal.tsx`;
- `src/app/groups/[groupId]/share-button.tsx`;
- `src/components/currency-selector.tsx`;
- `src/components/category-selector.tsx`.

`src/components/ui/drawer.test.tsx` covers the wrapper contract and `src/components/drawer-consumers.test.tsx` covers mobile selector opening, selection, and closing with the real local Drawer. Live verification is still required for drag gestures, scroll locking, focus return, keyboard-open viewport behavior, safe areas, and nested Dialog/Drawer interaction on Safari/iOS/PWA.

## 7. cmdk usage

`cmdk` was previously wrapped by `src/components/ui/command.tsx` and used by exactly two searchable selectors: `CategorySelector` and `CurrencySelector`. No command palette consumer was found. Phase 2E removed `cmdk` and `command.tsx`; both selectors now use the local `src/components/ui/combobox.tsx` Base UI boundary while retaining Popover on desktop and Vaul Drawer on mobile.

## 8. @material/web usage

`src/app/material-lab/material-lab-demo.tsx` imports filled/outlined buttons, checkbox, assist chip, select/select option, slider, switch, and outlined text field custom elements. The only route consumer is `/material-lab`; no production component imports `@material/web`. Evidence supports classification **B: visual laboratory**. Keep it in Phase 0. Future cleanup may remove it only after confirming the route is not a supported product surface and checking whether any external link/bookmark depends on it.

## 9. Composition audit: asChild / Slot

### Patterns found

- `Button` uses `@radix-ui/react-slot` when `asChild` is true. This is used broadly, most often as `<Button asChild><Link ... /></Button>`.
- `FormControl` uses the same Slot boundary for React Hook Form controls.
- `PopoverTrigger asChild` wraps selector buttons.
- `DrawerTrigger asChild` wraps currency/category/share buttons.
- `DialogClose asChild` wraps buttons in account/settings flows.
- `CollapsibleTrigger asChild` wraps the advanced expense-options control.
- The migrated Select and Combobox wrappers use Base UI composition; no feature imports Base UI primitives directly.

There are approximately 50 `asChild` source references and six `Slot`/`react-slot` references, including wrapper declarations. The most migration-sensitive routes are landing, groups, group settings, expense creation/edit, category/currency selectors, and the group mobile chrome.

### Risks

- Replacing Slot with Base UI `render` can change ref/event/prop merge behavior.
- Links rendered through Button must remain real links, keyboard reachable, and accessible as links rather than become nested interactive elements.
- `DialogClose asChild` and trigger composition must preserve focus return after migration.
- Mobile selector buttons switch between Popover and Drawer, so the same trigger must work under both composition paths.

### Proposed future convention (not implemented)

Keep the local `Button` API as the only application boundary and implement one adapter for link composition inside that wrapper. During the migration, test `<Button asChild><Link /></Button>` as a contract, then move the implementation to Base UI `render` without changing feature call sites. Do not maintain direct Base UI imports in feature files.

## 10. Portals and stacking audit

### Current mounts and z-indexes

| Surface | Current mount/stack |
|---|---|
| App header | Fixed `z-50`; accounts for `safe-area-inset-top` |
| Dialog | Base UI Portal; overlay, viewport, and popup `z-50`; content is centered, scrollable, and padded for top/bottom safe areas |
| Drawer | Base UI Portal; overlay, viewport, popup, and content `z-50`; bottom sheet max height is `min(85dvh, 42rem)` and includes bottom safe area |
| Dropdown Menu | Base UI Portal + Positioner; content/subcontent `z-50`, max height `80vh` |
| Popover | Radix Portal; content `z-50` |
| Select | Base UI Portal + Positioner; popup `z-50`, max height `24rem` |
| Toast | Toast viewport `z-[100]`; top on mobile and bottom/right on larger screens |
| Expense flow header | Sticky `z-30` |
| Mobile FAB | Fixed `z-40`, above the bottom nav by `5.25rem` plus bottom safe area |
| Mobile bottom navigation | Fixed `z-40`, bottom safe area, backdrop blur; four route links |

`src/app/layout.tsx` renders the fixed header and the global `Toaster`. The group layout renders the FAB and bottom navigation only for Summary/Expenses contexts, while reserving `pb-24` for page content. `globals.css` adds an `.app-shell::before` fixed decorative grid at `z-0`, and the main content is `z-10`.

### Risks / unknowns

- There is no isolated `isolation: isolate` stacking root yet; the roadmap explicitly reserves that for the future Base UI foundation phase.
- Multiple surfaces share `z-50`, while header and overlays can coexist. **UNKNOWN / NEEDS LIVE VERIFICATION:** exact interaction when an overlay opens over mobile chrome and the fixed header.
- **UNKNOWN / NEEDS LIVE VERIFICATION:** Safari/iOS viewport and keyboard behavior for centered Dialog, Base UI Drawer, Select, and the sticky expense form footer.
- **UNKNOWN / NEEDS LIVE VERIFICATION:** whether `backdrop-blur` creates any device-specific stacking/compositing issue with portals.
- Safe-area handling is present in header, Dialog, Drawer, FAB, and bottom navigation; it has not been verified on a real iOS/PWA install.

No stacking root, token, overlay, or CSS change was made in this phase.

## 11. Mobile/PWA chrome

- `viewportFit: 'cover'` is enabled in `src/app/layout.tsx`.
- The header reserves top safe area and the shell reserves the fixed header height.
- Group pages reserve bottom space with `pb-24` while mobile chrome is shown.
- Bottom navigation has four route destinations: Summary, Expenses, Balances, and Settings. It is route navigation, not a Radix/Base UI Tabs instance.
- The FAB links to `/groups/<groupId>/expenses/create`, appears on Summary and Expenses, and uses a 48px square target.
- `Drawer` and `Dialog` add internal safe-area padding; `ToastViewport` intentionally sits above all current surfaces at `z-[100]`.
- **UNKNOWN / NEEDS LIVE VERIFICATION:** keyboard avoidance, dynamic viewport changes, VoiceOver focus order, and whether the FAB can interfere with an open Dialog/Drawer.

## 12. Critical UX flows

| Flow | Current path/evidence | Protection status | Live prerequisite |
|---|---|---|---|
| Sign in | Links to `/auth/login?connection=google-oauth2` when auth is enabled | Existing route logic; no browser smoke | Auth provider configured |
| View `/groups` | `RecentGroupList`; `groups.mine`; local legacy-group merge | Existing unit/procedure coverage; new E2E not available | Auth or guest mode plus data |
| Create group | `/groups/create` → `CreateGroup` → `GroupForm` | Existing GroupForm and tRPC tests | Auth when enabled |
| Enter group | Group card Link → group layout → summary redirect | Not browser-automated | Existing group id and membership |
| Summary | Summary client and group layout context | Route/component evidence; no E2E | Existing group data |
| Expenses | Infinite expense list | No UI smoke | Existing group data |
| Create expense | FAB or route → expense form | Existing form logic only | Existing group, participants, categories, currency |
| Edit expense | Expense card Link → edit form | No UI smoke | Existing expense id |
| Balances | `groups.balances.list` → reimbursements | Existing balance/reimbursement code; no E2E | Group with expenses |
| Change active participant | ActiveUser Dialog on desktop / Drawer on mobile | Existing `active-user-modal.test.tsx` plus Dialog wrapper contract tests; authenticated modal flow still needs live verification | Auth and group participants |
| Group context menu | Card Dropdown Menu | Jest wrapper/overlay contracts and consumer wiring; browser menu still unverified | `/groups` data |
| Pin/unpin | Group card menu → `updateMembership` or local helper | Existing unit/procedure coverage; no E2E | Persisted membership or local guest state |
| Archive/unarchive | Group card menu → same membership mutation/local helper | Existing helper/procedure coverage; no E2E | Group membership |
| Delete/leave membership | Group settings mutation or group-card remove path | Existing backend coverage for removal; exact UI semantics need live verification | Membership role and group state |
| Four mobile destinations | Group layout maps Summary/Expenses/Balances/Settings links | New contract test documents route destinations; browser viewport unverified | Group data and 390x844 viewport |
| Dialog open/Escape/focus return | Base UI Dialog wrapper | `src/components/ui/dialog.test.tsx` covers open, title/description, controlled state, Escape, outside press, explicit close, and focus return | Installed dependencies |
| Select/Popover open | Expense/group/currency/category controls | Contract recorded; no browser/E2E | Form data and media query |

No incompatible fixtures were invented. Authenticated flows are deliberately marked as requiring real environment data.

## 13. `/groups` financial card contract

The authenticated `groups.mine` response keeps membership ordering and adds a
single backend batch aggregation for the list:

- `totalSpentByCurrency` contains non-reimbursement totals keyed by effective
  currency;
- `personalBalanceByCurrency` uses the persisted active participant and never
  combines incompatible currencies;
- `lastActivityAt` comes from the latest recorded group activity;
- participant count remains the existing Prisma `_count` aggregate;
- missing active-participant linkage produces an explicit unavailable-summary
  fallback rather than an invented balance.

The list renders these fields without per-card queries. Legacy/local cards keep
their existing lightweight fallback, while favorite, archive, remove, and
optimistic membership behavior remain unchanged. The card avatar is derived
deterministically from the group name and id.

## 14. Existing test coverage

The repository uses Jest through `jest.config.ts` and Next Jest with JSDOM. Existing tests cover:

- group form submission and active participant defaults;
- current-user and group tRPC reads/writes;
- API group creation and active participant persistence;
- local/persisted group merging, star/archive ordering, and migration payloads;
- active-user selection logic and backend persistence;
- formatting and utility behavior.

There is no Jest setup file, no `jest-axe`, no accessibility matcher setup, no Playwright configuration, and no E2E script in `package.json`. `.playwright-cli/` contains prior captured logs/pages, but it is not a reproducible test harness in this checkout.

## 14.1 Phase 5 actionable balances contract

`groups.balances.list` remains the source of truth for balances and suggested
reimbursements. The response is interpreted per `currencyCode`; currencies are
never netted together or transferred across one another. The suggestion
algorithm partitions positive creditor balances and negative debtor balances,
sorts both lists deterministically, and emits positive greedy transfers with no
self-transfers. Its focused tests cover two-party settlement, chains, multiple
creditors/debtors, settled groups, minor-unit rounding, and currency isolation.

The Balances route now presents “Suggested payments” first as mobile-first cards
with payer, recipient, amount, currency, and total/partial payment actions. Cards
involving `currentActiveParticipantId` receive a visual and textual “You pay” or
“You receive” cue, while all transfers remain visible. Individual balances are
secondary behind a Base UI Collapsible and retain their per-currency detail.

“Mark as paid” uses the specialized reimbursement mutation over the existing
reimbursement-expense source of truth; no `Settlement` model or new persistence
contract was introduced. The dialog stays
open while the mutation is pending or fails, prevents duplicate submits, closes
on success, invalidates related queries, and reports success/error through the
existing toast manager. Authenticated browser verification at 390x844 and
desktop remains **UNKNOWN / NEEDS LIVE VERIFICATION** because this checkout has
no reproducible authenticated fixtures.

## 14.2 Phase 4 summary dashboard contract

`/groups/[groupId]/summary` is the operational group home. Its financial
overview comes from the existing `groups.stats.get` procedure, extended with
`totalSpentByCurrency`, `personalBalanceByCurrency`, and `lastActivityAt`.
Totals are aggregated from the existing balance expense source, excluding
reimbursements and keeping currencies separate. Personal position reuses
`getBalancesByCurrency`; Summary does not calculate settlements or render
from/to transfers.

Recent expenses use one limited `groups.expenses.list` query with a limit of
five. The backend already orders by `expenseDate desc, createdAt desc`, so no
client-side resorting or per-row query is introduced. The dashboard has two
client data queries (stats and the limited list), and the stats procedure keeps
its database reads parallel; no N+1 or full expense hydration for totals is
introduced. `lastActivityAt` is the latest recorded expense date, not a complete
activity-feed timestamp; the full activity feed remains out of scope.

When there is no reliable `currentActiveParticipantId`, Summary invokes the
layout-owned `ActiveUserModal` through the existing group context. The mobile
bottom navigation, FAB, safe-area padding, and existing routes remain in the
group layout. Summary links to Balances for actionable payments and preserves
the complete Phase 5 reimbursement, greedy algorithm, detail, and regression
test behavior.

Focused coverage is provided by `src/app/groups/[groupId]/summary/page.client.test.tsx`
and `src/lib/summary.test.ts`: single and multiple currencies, positive,
negative, settled and absent participant states, recent expenses, empty state,
real expense/balance links, and latest activity ordering. Authenticated browser
verification of `/summary` at desktop and 390px remains **UNKNOWN / NEEDS LIVE
VERIFICATION** because this checkout has no reproducible authenticated fixture.

## 14.3 Phase 6 settlement payment contract

`Expense` with `isReimbursement = true` remains the sole settlement source of
truth. No Prisma `Settlement` model, table, or migration was added. Assisted
payments use `groups.reimbursements.create`, which reuses `createExpense` after
server-side membership, participant, currency, positive minor-unit amount, and
current suggested-debt validation. Amounts above the current debt are rejected;
the client never silently clamps them. Generic expense creation remains
available for backward-compatible manual or historical reimbursements.

The existing transaction creates the Expense, its `paidFor` rows, and the
`CREATE_EXPENSE` Activity atomically. Balances, expenses, stats, activities, and
reimbursement history are invalidated after success, so Summary refreshes when
revisited.

Balances now includes a lightweight “Registered payments” section backed by
`groups.reimbursements.list`, filtered to `isReimbursement = true` and ordered
newest first. Each row keeps its own currency and displays payer, payee, amount,
and date. Existing expense deletion/editing remains the reversal path; editing
a reimbursement preserves its reimbursement flag and recalculates balances.

Focused coverage includes full and partial server validation, participant and
currency rejection, zero/negative/non-finite amounts, overpayment rejection,
minor-unit recalculation, comma-decimal UI input, partial over-max feedback,
success/error/pending payment UI, and the existing Phase 5 balance tests.
Authenticated browser verification of full/partial payment, history, settled
state, multi-currency, delete/reverse, network error, and double-click behavior
remains **UNKNOWN / NEEDS LIVE VERIFICATION** because this checkout has no
reproducible authenticated fixtures.

## 14.4 Phase 7 Quick Add contract

Quick Add is mounted by `QuickExpenseProvider` in the group layout and exposes
one `QuickExpenseTrigger` for the mobile FAB, Summary CTA, and Expenses empty
state. The full route `/groups/[groupId]/expenses/create` remains available
from the drawer as the advanced fallback; no route or bottom-navigation
semantics changed.

The drawer reuses `expenseFormSchema`, the generic
`groups.expenses.create` mutation, group split defaults, group currency, the
validated `currentActiveParticipantId`, category/date defaults, and the shared
minor-unit persistence helper. It always submits `isReimbursement = false`.
Advanced fields (category, date, currency, split, participants, and notes) are
progressively disclosed through the existing local Collapsible. No second
schema, mutation, settlement flow, or expense-list redesign was introduced.

Success closes and resets the drawer, shows a toast, and invalidates only the
related expense, reimbursement, balance, stats, activity, and group-summary
queries. Errors keep the drawer and draft intact; the pending state disables
Save and prevents double submission. The Base UI Drawer wrapper preserves
virtual-keyboard handling, internal scrolling, focus, Escape, swipe, backdrop,
and safe-area behavior. Automated focused coverage covers defaults, active
payer, comma-decimal minor units, advanced options, success/error, missing
payer, pending state, and the full-form link.

All locale files contain the `QuickExpense` namespace. Non-English locales use
the repository's current English fallback policy for these new keys until
human translations are available. Authenticated browser verification at 390px,
360px, desktop, and with the keyboard open remains **UNKNOWN / NEEDS LIVE
VERIFICATION** because this checkout has no reproducible authenticated fixture.
Phase 5 and Phase 6 reimbursement behavior remain complete and untouched.

## 14.5 Phase 8 expense list contract

`/groups/[groupId]/expenses` keeps the existing group-wide infinite query and
its expense-date ordering. Each row now prioritizes title, amount in the
expense's original currency, payer, date, and the active participant's personal
share. The share is derived from the existing `calculateShare` helper using
the already-loaded `paidFor` payload; no query is performed per row and no
cross-currency conversion is introduced.

Rows use the existing category icon, distinguish reimbursement expenses as
localized `Payment`/`Registered payment` entries, keep the expandable detail,
attachments indicator, and edit link, and show a localized excluded state when
the active participant is not included. With no active participant selected,
the list omits personal-share copy rather than fabricating a value. Loading and
empty states remain group-level and Quick Add remains the Expenses entry point.

The new `ExpenseCard` labels are present in every locale file; non-English
locales follow the repository's current English fallback policy until human
translations are available. Focused helper coverage covers even, shares,
percentage, amount, excluded, missing-participant, and reimbursement states.
Authenticated visual verification for 390px, 430px, desktop, multi-currency,
long content, and attachments remains **UNKNOWN / NEEDS LIVE VERIFICATION**.
The previously reported `min0` issue was intentionally not changed in Phase 8.

## 15. New smoke coverage

Added `src/components/ui/overlay-smoke.test.tsx`, `src/components/ui/dropdown-menu.test.tsx`, `src/components/ui/dialog.test.tsx`, and `src/components/ui/select-combobox.test.tsx` using the existing Jest + Testing Library stack. The tests target migration-stable behavior rather than Radix markup snapshots:

- Dialog opens from its trigger, exposes title/description, supports controlled state, closes with Escape, outside press, or an explicit Close, and returns focus to the trigger.
- Dropdown menu opens from its trigger and closes with Escape; the dedicated menu suite also covers keyboard activation emulation, navigation, focus return, disabled items, checkbox/radio state, `asChild` links, and nested menus.
- Select opens, exposes its option list, selects controlled and uncontrolled values, preserves disabled options, handles Escape, and returns focus to its trigger.
- Combobox filters through Base UI's data collection, selects a result, reports no results, and keeps Escape available to the surrounding Popover/Drawer in inline mode.

La suite enfocada de Dropdown Menu pasa en Jest con JSDOM. La suite completa de Jest conserva seis fallos no relacionados y `bun test` directo no configura JSDOM ni las APIs de Jest; no se modificó la infraestructura de tests en esta fase. No se introdujo un framework nuevo ni una suite de snapshots.

## 16. Base UI migration matrix

The target names below are verified against the current Base UI documentation; exact APIs and package version must be rechecked at the start of each migration commit.

| Current wrapper | Current primitive | Main consumers | Base UI target | Risk | Target phase |
|---|---|---|---|---|---|
| `dialog.tsx` | Radix Dialog | Active user, settings, reimbursements, documents, account | `Dialog` | High: focus, portals, nested flows | 2D |
| `dropdown-menu.tsx` | Radix Dropdown Menu | Group cards, export, locale, theme | `Menu` | Medium: roving focus, destructive items, submenus | 2C |
| `popover.tsx` | Radix Popover | Category, currency, share | `Popover` | Medium: positioning and mobile fallback | 2A |
| `tooltip.tsx` | Not present | None found | `Tooltip` only if a real consumer is added | Unknown | 2A |
| `checkbox.tsx` | Radix Checkbox | Expense form, settings | `Checkbox` | Medium: form values | 2B |
| `radio-group.tsx` | Radix Radio Group | Active user modal | `Radio` | Medium: controlled selection and disabled state | 2B |
| `collapsible.tsx` | Radix Collapsible | Account, expense advanced options | `Collapsible` | Low/medium: height animation | 2A |
| `select.tsx` | **Phase 2E historical Radix Select; removed** | Group and expense forms | `Select` | High: keyboard/value/form behavior | 2E complete |
| `combobox.tsx` | Base UI Combobox | Category and currency selectors | `Combobox` | High: filtering, selection, mobile rendering | 2E complete |
| `command.tsx` | **Phase 2E historical cmdk composite; removed** | No consumers | `Combobox` | High: filtering, selection, mobile rendering | 2E complete |
| `tabs.tsx` | **Phase 2F historical Radix Tabs; removed** | No current consumers | `Tabs` | Low; wrapper-only migration for roadmap consistency | 2F complete |
| `drawer.tsx` | **Phase 2G historical Vaul Drawer; removed** | Mobile selectors, share, active user | `Drawer` | Very high: gestures, scroll, keyboard, safe areas | 2G complete |
| `toast.tsx` | Radix Toast | Global feedback | `Toast` | High: viewport and timing | 2A |
| `hover-card.tsx` | Radix Hover Card | Group form | `Preview Card` or `Popover` | Medium: touch semantics | 2A |
| `button.tsx` / `form.tsx` | Radix Slot composition | Broad | Base UI `render` adapter inside local wrappers | Very high: refs and nested props | 1/2D |

Bottom navigation is intentionally excluded from the Tabs migration: it changes routes and should remain navigation semantics unless a later product decision says otherwise.

## 16. Risks

1. The Slot/asChild boundary is broad and affects links, form controls, triggers, and close buttons.
2. Dialog, Drawer, Select, and mobile chrome share overlapping fixed/portal layers.
3. Base UI Drawer is the mobile sheet implementation; its direct Jest contract coverage does not replace real touch/gesture verification.
4. The former cmdk composite was embedded in two responsive selector implementations; Phase 2E preserves both Popover and Drawer paths through the Base UI Combobox boundary.
5. `@material/web` is isolated to a public route but may still be externally reachable or bookmarked.
6. The current install baseline is not reproducible in this environment because `package.json` and `bun.lock` disagree and the dependency tree is incomplete.
7. There is no committed browser harness, so visual and viewport regressions cannot yet be detected automatically.
8. Remaining Radix wrappers still rely on Radix state attributes and Tailwind animation utilities; replacing primitives without preserving state selectors can change motion and feedback.

## 17. Unknowns

- `UNKNOWN / NEEDS LIVE VERIFICATION`: authenticated data fixtures and end-to-end flow success in the current deployment/runtime.
- `UNKNOWN / NEEDS LIVE VERIFICATION`: desktop/mobile screenshots for the requested routes and open-overlay states; local runtime could not start because dependencies were incomplete and required environment variables were absent.
- `UNKNOWN / NEEDS LIVE VERIFICATION`: iOS Safari/PWA safe-area, keyboard, scroll lock, and focus behavior.
- `UNKNOWN / NEEDS LIVE VERIFICATION`: exact browser behavior of nested Dialog/Drawer and Select/Popover overlays over the bottom navigation.
- `UNKNOWN / NEEDS LIVE VERIFICATION`: whether `/material-lab` is intentionally public product surface or a disposable experiment.
- `UNKNOWN / NEEDS LIVE VERIFICATION`: whether `search-bar.tsx`, `table.tsx`, and `tabs.tsx` are referenced dynamically outside static imports.

## Phase 0 exit criteria

- [x] Remote starting state verified; no remote advancement detected.
- [x] Existing routes, UI wrappers, dependency imports, composition, portals, mobile chrome, and migration seams inventoried.
- [x] No Base UI package installed and no existing primitive migrated.
- [x] No visual tokens, colors, model, archive/star semantics, or product flows changed.
- [x] Migration-stable Jest smoke coverage added without snapshots.
- [ ] Browser smoke/E2E and screenshots — blocked by missing reproducible local runtime/data; carry into the next environment-ready verification pass.
