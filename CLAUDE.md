# building_blocks - AI Development Guide

> **Git policy — never auto-commit or auto-push.** Leave work in the working tree. Run
> `git commit`, `git push`, `gh pr create`, or `scripts/push_all.sh` **only when the user
> explicitly asks in that turn**. Approval for an earlier change does not carry forward.
> Do not create feature branches; stay on the current branch.

## Overview

`@sudobility/building_blocks` — ESM-only React component library of higher-level, reusable
app-shell UI (app wrappers, topbars, footers, breadcrumbs, layout, settings, text/sitemap/login
pages, empty state) built on `@sudobility/components` + `@sudobility/design`.

**Scope boundary (important):** this package holds only common, broadly reusable blocks. It has
**no** dependency on entities or subscriptions. The entity-aware app wrapper lives in
`@sudobility/entity_pages`; subscription/pricing screens (`AppPricingPage`, subscription
providers) live in `@sudobility/subscription_pages`. Apps compose those on top of this package.
References to those packages in `src/index.ts` / `src/firebase.ts` are comments explaining what
was moved out — not imports. Do not reintroduce such dependencies here.

- **License**: BUSL-1.1
- **Package manager**: Bun — always use `bun`, never `npm`.
- **Stack**: React 18/19, TypeScript ~6.0.3, Vite 8 (lib mode), Vitest 4.

## Commands

```bash
bun install                 # deps (not checked in; node_modules starts empty)
bun run build               # vite build + tsc -p tsconfig.build.json + scripts/fix-esm-imports.mjs
bun run dev                 # vite build --watch
bun run typecheck           # tsc --noEmit  (alias: type-check)
bun run lint                # eslint, --max-warnings 0   (lint:fix to auto-fix)
bun run format              # prettier --write  (format:check to verify)
bun run test:unit           # vitest run  (NOTE: there is no `test` script)
bun run test:watch          # vitest watch
bun run test:ui             # vitest --ui
bun run clean               # rm -rf dist
```

Full check: `bun run typecheck && bun run lint && bun run test:unit`.

## Architecture

### Dual entry points
- **`@sudobility/building_blocks`** (`src/index.ts`): core, no hard auth dependency. Safe anywhere.
- **`@sudobility/building_blocks/firebase`** (`src/firebase.ts`): Firebase-auth-dependent exports
  (`SudobilityAppWithFirebaseAuth`, `ApiProvider`, `useApi`, `useApiSafe`). Requires
  `@sudobility/components/auth`, `@sudobility/auth_lib`.

### Component-injection pattern
Optional-package components are passed in as props, never imported, to keep peers optional:
- `AuthActionComponent` ← `@sudobility/components/auth`
- `WalletDropdownMenuComponent` ← `@sudobility/web3-components`
- `StatusIndicatorComponent` ← `@sudobility/components/devops`

### App-wrapper provider order (outer → inner)
`HelmetProvider > I18nextProvider > ThemeProvider > NetworkProvider > QueryClientProvider >
ToastProvider > [AppProviders] > BrowserRouter > [PageTracker + Suspense + Toasts + InfoBanner]`.
`SudobilityAppWithFirebaseAuth` adds `AuthProvider > ApiProvider` inside AppProviders.
`InfoBanner` is imported from `@sudobility/di_web`.

### Styling
Tailwind via `@sudobility/design` tokens (`text-theme-*`, `bg-theme-*`, `dark:` variants).
Use `cn()` (`src/utils`, clsx + tailwind-merge) for class merging and `cva` for variants.
`@sudobility/design` provides `GRADIENT_CLASSES` and `textVariants`.

### i18n
i18next + react-i18next (+ optional http-backend / browser-languagedetector).
`src/constants/languages.ts` ships **15** `DEFAULT_LANGUAGES` (en, de, es, fr, it, ja, ko, pt,
ru, sv, th, uk, vi, zh, zh-hant). `RTL_LANGUAGES` is **empty** by default; `isRTL()` checks it.
Detection order: URL path, localStorage, navigator. Components take `t` function props for labels.

### Analytics
Interactive components accept optional `onTrack?: (params: AnalyticsTrackingParams) => void`.
`AnalyticsEventType` = `'button_click' | 'link_click' | 'navigation' | 'settings_change' |
'subscription_action' | 'page_view'`. Components wired today: `GlobalSettingsPage`, `AppFooter`,
`AppFooterForHomePage`.

### API context (firebase entry)
`ApiProvider` manages the Firebase ID token + network client. `useApi()` throws outside a
provider; `useApiSafe()` returns null. Reads `VITE_API_URL`.

## Project structure

```
src/
  index.ts / firebase.ts        # the two entry points
  types.ts                      # all shared types, re-exported from main entry
  components/
    app/      SudobilityApp.tsx, SudobilityAppWithFirebaseAuth.tsx, AuthQueryCacheReset.tsx
    api/      ApiContext.tsx (ApiProvider, useApi, useApiSafe)
    topbar/   app-topbar(+ -with-firebase-auth / -with-wallet), language-selector
    breadcrumbs/ footer/ layout/ settings/ empty-state/ pages/
  constants/languages.ts        # DEFAULT_LANGUAGES, RTL_LANGUAGES, isRTL
  utils/index.ts                # cn()
  i18n/index.ts                 # initializeI18n, getI18n, i18n
  test/setup.ts                 # vitest setup (jest-dom)
  __tests__/                    # *.test.tsx
```

## Conventions

- **TypeScript strict**, `noUnusedLocals` / `noUnusedParameters`. Path alias `@/*` → `./src/*`.
- Props type name: `{ComponentName}Props`. All shared types centralized in `src/types.ts`.
- **Structural typing** (`QueryClientLike`, `I18nLike`) in app wrappers avoids cross-package type
  conflicts under `bun link`.
- **File naming**: kebab-case for most components (`app-footer.tsx`); PascalCase reserved for
  app wrappers and a few standalone (`SudobilityApp.tsx`, `EmptyState.tsx`). Do not rename
  existing files. Each component dir has its own `index.ts` barrel.
- Build output `dist/`: ESM only, not minified, source maps on; all `@sudobility/*`, `react`,
  `firebase`, etc. are externalized.

## Gotchas

- **No `test` script** — use `bun run test:unit`.
- `@sudobility/*` publishes to **GitHub Packages**; `.npmrc` maps the scope to
  `npm.pkg.github.com` (install needs an auth token).
- `scripts/push_all.sh` rewrites the two `@sudobility` peer ranges to the latest published
  version on release — `package.json` is the source of truth for those versions.
- `"useApi must be used within an ApiProvider"` → wrap in `ApiProvider`/a Firebase wrapper, or use
  `useApiSafe()`.
- `/firebase` import errors → ensure `@sudobility/components/auth`, `@sudobility/auth_lib`,
  `@sudobility/di` are installed (optional peers).

## Common tasks

- **New component**: `src/components/{name}/` with Props interface + `index.ts` barrel → add to
  `src/components/index.ts` → if public, add to `src/index.ts` → test in `src/__tests__/` →
  `bun run typecheck && bun run lint && bun run test:unit`.
- **Analytics on a component**: add `onTrack?` prop, make a `useCallback` `track(label, params)`
  helper emitting `{ eventType, componentName, label, params }`, call on interactions.
- **New settings section**: pass `additionalSections` (`SettingsSectionConfig[]`) to
  `GlobalSettingsPage`.
- **New language**: edit `DEFAULT_LANGUAGES` in `src/constants/languages.ts` (add code to
  `RTL_LANGUAGES` if RTL).
