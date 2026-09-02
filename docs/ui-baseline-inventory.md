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
| `/groups` | `recent-group-list.tsx` and `recent-group-list-card.tsx` | `viewer.getCurrent`, `groups.mine`, legacy local-group sync; star/archive/remove membership mutations | Context menu per group card; links to create and group |
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
| `@radix-ui/react-dialog` | Dialog wrapper, plus `DialogProps` in `command.tsx` | `src/components/ui/dialog.tsx` | 2 importing files | High | High | Base UI `Dialog`; preserve controlled state, focus return, Escape, and portal behavior |
| `@radix-ui/react-dropdown-menu` | Group-card actions, export, locale, theme | `dropdown-menu.tsx` | 1 wrapper + 4 main consumers | High | Medium | Base UI `Menu`; current menu exposes checkbox/radio/submenu parts |
| `@radix-ui/react-popover` | Category, currency, share controls | `popover.tsx` | 1 wrapper + 3 consumers | High | Medium | Base UI `Popover`; check positioner/portal and mobile fallback |
| `@radix-ui/react-select` | Group form and expense form | `select.tsx` | 1 wrapper + 2 main consumers | High | High | Base UI `Select`; dependent on form value/keyboard semantics |
| `@radix-ui/react-checkbox` | Settings and expense participant selection | `checkbox.tsx` | 1 wrapper + 2 consumers | Medium | Medium | Base UI `Checkbox`; preserve form serialization and indeterminate behavior |
| `@radix-ui/react-collapsible` | Account sections and advanced expense options | `collapsible.tsx` | 1 wrapper + 2 consumers | Medium | Low | Base UI `Collapsible` |
| `@radix-ui/react-radio-group` | Active participant selection | `radio-group.tsx` | 1 wrapper + modal | High | Medium | Base UI `Radio`; preserve controlled value and disabled linked participants |
| `@radix-ui/react-tabs` | Wrapper exists but no consumer import was found | `tabs.tsx` | 1 wrapper, 0 consumers | Low / legacy candidate | Low | Base UI `Tabs` only if a real same-page tab use appears; bottom navigation is route navigation, not Tabs |
| `@radix-ui/react-toast` | Global feedback provider and viewport | `toast.tsx`, `toaster.tsx` | 1 wrapper + layout | High | Medium | Base UI `Toast`; verify viewport stacking above mobile chrome |
| `@radix-ui/react-hover-card` | Participant help/preview in group form | `hover-card.tsx` | 1 wrapper + group form | Medium | Medium | Base UI `Preview Card` if the interaction remains a preview; verify touch fallback |
| `@radix-ui/react-label` | Form and Label wrappers | `label.tsx`, `form.tsx` | 2 wrappers | Medium | Low | Base UI `Field`/native label strategy; do not change form semantics in Phase 0 |
| `@radix-ui/react-slot` | Button and Form composition | `button.tsx`, `form.tsx` | 2 wrappers; ~50 `asChild` references | Very high | High | Base UI `render` composition; this is a migration seam, not changed here |
| `@radix-ui/react-icons` | Theme and starred-group icons | Direct imports | 2 consumers | Low | Low | Not a primitive migration blocker; keep until icon policy is decided |
| `vaul` | Drawer root, trigger, portal, overlay, content, title/description | `src/components/ui/drawer.tsx` | 1 wrapper + 5 consumers | High on mobile | High | Base UI `Drawer`; preserve gestures, focus lock, scroll, safe-area, and keyboard behavior |
| `cmdk` | Searchable category and currency selectors | `src/components/ui/command.tsx` | 1 wrapper + 2 selectors | Medium | Medium/High | Base UI `Combobox` is the likely target; confirm whether command-palette semantics are ever needed |
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
| `command.tsx` | A composite primitive | cmdk + Radix Dialog type | CategorySelector, CurrencySelector | No | Via parent dialog/popover/drawer | High | Base UI Combobox where appropriate | 2E |
| `dialog.tsx` | A overlay wrapper | Radix Dialog | Account, settings, reimbursements, active user, documents | No | Yes | Controlled/uncontrolled; focus managed by Radix | High | Base UI Dialog | 2D |
| `drawer.tsx` | A overlay wrapper | Vaul | Active user, share, currency, category | Yes through primitives | Yes | Controlled/uncontrolled; gesture/focus managed by Vaul | Very high | Base UI Drawer | 2G |
| `dropdown-menu.tsx` | A overlay wrapper | Radix Dropdown Menu | Group cards, export, locale, theme | Trigger API | Yes | Keyboard roving focus; menu state | High | Base UI Menu | 2C |
| `empty-state.tsx` | B visual | Own | Expenses, balances, reimbursements | No | No | Static | Low | Own visual component | N/A |
| `form.tsx` | C form support | Radix Label + Slot | Group and expense forms | Via Slot | No | React Hook Form integration | High | Base UI Field/Form boundary, later | 2B/2E |
| `group-section-card.tsx` | F surface/layout | Own | Most top-level sections | No | No | Static | Low | Own surface | N/A |
| `hover-card.tsx` | A overlay wrapper | Radix Hover Card | Group form | Trigger API | No explicit wrapper portal | Hover/focus preview state | High on touch | Base UI Preview Card or Popover | 2A |
| `input.tsx` | C form control | Own | Account, group, expense, share | No | No | Native input | Medium | Own input / Base UI Field composition | 2B |
| `label.tsx` | C form support | Radix Label | Form and active-user modal | No | No | Native label association | Low | Base UI Field label or native label | 2B |
| `page-container.tsx` | F layout | Own | Account, groups, material lab | No | No | Static | Low | Own layout | N/A |
| `page-header.tsx` | E navigation/layout | Own | Account, groups, balances, settings | No | No | Static | Low | Own layout | N/A |
| `popover.tsx` | A overlay wrapper | Radix Popover | Category, currency, share | Trigger API | Yes | Controlled in selectors | High on mobile; drawer fallback | Base UI Popover | 2A |
| `radio-group.tsx` | A form primitive | Radix Radio Group | Active user modal | No | No | Controlled value in modal | High | Base UI Radio | 2B |
| `search-bar.tsx` | G legacy candidate | Own | No consumer found | No | No | Local input state | Unknown | Keep until removal is verified | N/A |
| `select.tsx` | A form primitive | Radix Select | Group and expense forms | Internal icon `asChild` | Yes | Default/controlled value; keyboard state | High | Base UI Select | 2E |
| `skeleton.tsx` | B feedback visual | Own | Loading states across routes | No | No | Static | Low | Own visual component | N/A |
| `table.tsx` | G legacy candidate | Own | No consumer found | No | No | Static | Unknown | Keep until removal is verified | N/A |
| `tabs.tsx` | G legacy candidate | Radix Tabs | No consumer found | No | No | Primitive state | Medium | Base UI Tabs only with real consumer | 2F |
| `textarea.tsx` | C form control | Own | Group form | No | No | Native textarea | Medium | Own textarea / Base UI Field composition | 2B |
| `toast.tsx` | D feedback overlay | Radix Toast + CVA | Global toaster and upload feedback | No | Viewport is primitive-owned | Provider state; swipe/focus behavior | High; `z-[100]` | Base UI Toast | 2A |
| `toaster.tsx` | D feedback support | Local composition | Root layout | No | Through Toast viewport | Reads global toast store | High | Own composition over Base UI Toast | 2A |

No `src/components/ui/tooltip.tsx` exists and no Tooltip package/import was found. This is a concrete difference from the roadmap's future component list, not a missing row to invent.

### Phase 2A update

The Phase 0 statement above is historical. Phase 2A added `src/components/ui/tooltip.tsx` as a Base UI wrapper even though no production consumer currently exists. The Popover and Collapsible wrappers were migrated in place; their existing feature imports remain local and their Radix packages were removed only after the global import check returned zero real imports.

## 5. Radix usage

The repository has 12 Radix primitive packages plus the icon package and Slot. All primitive imports are behind local wrappers except `@radix-ui/react-icons` and the `DialogProps` type import used by `command.tsx`. The highest-risk wrappers are Dialog, Select, Drawer, Dropdown Menu, and Slot because they combine focus, portal, form, or composition behavior.

## 6. Vaul usage

`vaul` has one direct import in `src/components/ui/drawer.tsx`. Consumers are:

- `src/app/groups/[groupId]/expenses/active-user-modal.tsx`;
- `src/app/groups/[groupId]/share-button.tsx`;
- `src/components/currency-selector.tsx`;
- `src/components/category-selector.tsx`.

The test file mocks the Drawer boundary instead of exercising Vaul. Live verification is required for drag gestures, scroll locking, focus return, keyboard-open viewport behavior, and nested Dialog/Drawer interaction on Safari/iOS/PWA.

## 7. cmdk usage

`cmdk` is wrapped by `src/components/ui/command.tsx` and is used by exactly two searchable selectors: `CategorySelector` and `CurrencySelector`. Both select Popover on desktop and Drawer on mobile based on `useMediaQuery`. No command palette consumer was found. Migration should therefore evaluate Base UI `Combobox` rather than assume a generic command palette replacement.

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
- Radix Select's internal icon uses `asChild` for the Lucide chevron.

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
| Dialog | Radix Portal; overlay and content `z-50`; content is centered, scrollable, and padded for top/bottom safe areas |
| Drawer | Vaul Portal; overlay/content `z-50`; bottom sheet max height is `min(85dvh, 42rem)` and includes bottom safe area |
| Dropdown Menu | Radix Portal; content/subcontent `z-50`, max height `80vh` |
| Popover | Radix Portal; content `z-50` |
| Select | Radix Portal; content `z-50`, max height `24rem` |
| Toast | Toast viewport `z-[100]`; top on mobile and bottom/right on larger screens |
| Expense flow header | Sticky `z-30` |
| Mobile FAB | Fixed `z-40`, above the bottom nav by `5.25rem` plus bottom safe area |
| Mobile bottom navigation | Fixed `z-40`, bottom safe area, backdrop blur; four route links |

`src/app/layout.tsx` renders the fixed header and the global `Toaster`. The group layout renders the FAB and bottom navigation only for Summary/Expenses contexts, while reserving `pb-24` for page content. `globals.css` adds an `.app-shell::before` fixed decorative grid at `z-0`, and the main content is `z-10`.

### Risks / unknowns

- There is no isolated `isolation: isolate` stacking root yet; the roadmap explicitly reserves that for the future Base UI foundation phase.
- Multiple surfaces share `z-50`, while header and overlays can coexist. **UNKNOWN / NEEDS LIVE VERIFICATION:** exact interaction when an overlay opens over mobile chrome and the fixed header.
- **UNKNOWN / NEEDS LIVE VERIFICATION:** Safari/iOS viewport and keyboard behavior for centered Dialog, Vaul Drawer, Select, and the sticky expense form footer.
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
| Change active participant | ActiveUser Dialog on desktop / Drawer on mobile | Existing `active-user-modal.test.tsx`; wrapper behavior not tested before this phase | Auth and group participants |
| Group context menu | Card Dropdown Menu | New wrapper smoke contract added; browser menu still unverified | `/groups` data |
| Pin/unpin | Group card menu → `updateMembership` or local helper | Existing unit/procedure coverage; no E2E | Persisted membership or local guest state |
| Archive/unarchive | Group card menu → same membership mutation/local helper | Existing helper/procedure coverage; no E2E | Group membership |
| Delete/leave membership | Group settings mutation or group-card remove path | Existing backend coverage for removal; exact UI semantics need live verification | Membership role and group state |
| Four mobile destinations | Group layout maps Summary/Expenses/Balances/Settings links | New contract test documents route destinations; browser viewport unverified | Group data and 390x844 viewport |
| Dialog open/Escape/focus return | Radix Dialog wrapper | New Jest smoke test | Installed dependencies |
| Select/Popover open | Expense/group/currency/category controls | Contract recorded; no browser/E2E | Form data and media query |

No incompatible fixtures were invented. Authenticated flows are deliberately marked as requiring real environment data.

## 13. Existing test coverage

The repository uses Jest through `jest.config.ts` and Next Jest with JSDOM. Existing tests cover:

- group form submission and active participant defaults;
- current-user and group tRPC reads/writes;
- API group creation and active participant persistence;
- local/persisted group merging, star/archive ordering, and migration payloads;
- active-user selection logic and backend persistence;
- formatting and utility behavior.

There is no Jest setup file, no `jest-axe`, no accessibility matcher setup, no Playwright configuration, and no E2E script in `package.json`. `.playwright-cli/` contains prior captured logs/pages, but it is not a reproducible test harness in this checkout.

## 14. New smoke coverage

Added `src/components/ui/overlay-smoke.test.tsx` using the existing Jest + Testing Library stack. The tests target migration-stable behavior rather than Radix markup snapshots:

- Dialog opens from its trigger, closes with Escape, and returns focus to the trigger.
- Dropdown menu opens from its trigger and closes with Escape.
- Select opens and exposes its option list through the accessible role.

Execution is **BLOCKED / ENVIRONMENT** until dependency installation and Prisma client generation complete. No new test framework or snapshot suite was introduced.

## 15. Base UI migration matrix

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
| `select.tsx` | Radix Select | Group and expense forms | `Select` | High: keyboard/value/form behavior | 2E |
| `command.tsx` | cmdk composite inside Popover/Drawer | Category and currency selectors | `Combobox` | High: filtering, selection, mobile rendering | 2E |
| `tabs.tsx` | Radix Tabs | No current consumers | `Tabs` | Low until used | 2F |
| `drawer.tsx` | Vaul Drawer | Mobile selectors, share, active user | `Drawer` | Very high: gestures, scroll, keyboard, safe areas | 2G |
| `toast.tsx` | Radix Toast | Global feedback | `Toast` | High: viewport and timing | 2A |
| `hover-card.tsx` | Radix Hover Card | Group form | `Preview Card` or `Popover` | Medium: touch semantics | 2A |
| `button.tsx` / `form.tsx` | Radix Slot composition | Broad | Base UI `render` adapter inside local wrappers | Very high: refs and nested props | 1/2D |

Bottom navigation is intentionally excluded from the Tabs migration: it changes routes and should remain navigation semantics unless a later product decision says otherwise.

## 16. Risks

1. The Slot/asChild boundary is broad and affects links, form controls, triggers, and close buttons.
2. Dialog, Drawer, Select, and mobile chrome share overlapping fixed/portal layers.
3. Vaul is the only mobile sheet implementation and has no direct interaction tests.
4. cmdk is embedded in two responsive selector implementations, so a Combobox migration must preserve both Popover and Drawer paths.
5. `@material/web` is isolated to a public route but may still be externally reachable or bookmarked.
6. The current install baseline is not reproducible in this environment because `package.json` and `bun.lock` disagree and the dependency tree is incomplete.
7. There is no committed browser harness, so visual and viewport regressions cannot yet be detected automatically.
8. Current visual behavior relies on Radix state attributes and Tailwind animation utilities; replacing primitives without preserving state selectors can change motion and feedback.

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
