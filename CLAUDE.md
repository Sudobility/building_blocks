# building_blocks - AI Development Guide

> **Git policy — never auto-commit or auto-push.** Leave your work in the working tree.
> Run `git commit`, `git push`, `gh pr create`, or `scripts/push_all.sh` **only when the user
> explicitly asks in that turn**. Approval for an earlier change does not carry forward, and
> finishing a task is not permission to commit it.

## Overview

`@sudobility/building_blocks` is a React component library providing higher-level, reusable UI building blocks for Sudobility applications. It builds on top of `@sudobility/components` and `@sudobility/design` to deliver production-ready app shells, navigation bars, footers, settings pages, content/sitemap/login pages, and app wrappers with optional Firebase auth and i18n support.

This package intentionally holds only the common, broadly reusable building blocks. **It has no dependency on, and contains no components for, entities or subscriptions.** The entity-aware app wrapper lives in `@sudobility/entity_pages`; subscription/pricing screens and providers live in `@sudobility/subscription_pages`. Apps compose those on top of `building_blocks`.

- **Package**: `@sudobility/building_blocks`
- **License**: BUSL-1.1
- **Package Manager**: Bun (always use `bun` instead of `npm`)
- **Framework**: React 18/19, TypeScript ~6.0.3, Vite 8.x
- **Build**: ESM-only library via Vite lib mode + tsc declarations
- **Testing**: Vitest with React Testing Library

## Project Structure

```
src/
├── index.ts                        # Main entry point (core exports, no auth dependency)
├── firebase.ts                     # Secondary entry: Firebase-auth-dependent exports
├── types.ts                        # All shared TypeScript type definitions
├── vite-env.d.ts                   # Vite env type declarations (VITE_API_URL, etc.)
├── components/
│   ├── index.ts                    # Re-exports all component subdirectories
│   ├── app/                        # App wrapper components (provider stacks)
│   │   ├── SudobilityApp.tsx                   # Base app shell (i18n, theme, query, routing, toast)
│   │   ├── SudobilityAppWithFirebaseAuth.tsx   # + Firebase auth + ApiProvider
│   │   ├── AuthQueryCacheReset.tsx             # Clears react-query cache on auth change (internal)
│   │   └── index.ts
│   ├── api/                        # API context (Firebase token management)
│   │   ├── ApiContext.tsx           # ApiProvider, useApi, useApiSafe hooks
│   │   └── index.ts
│   ├── topbar/                     # Top navigation bar variants
│   │   ├── app-topbar.tsx                       # Base topbar with logo, nav, language selector
│   │   ├── app-topbar-with-firebase-auth.tsx    # + Firebase auth action button
│   │   ├── app-topbar-with-wallet.tsx           # + Web3 wallet connection
│   │   ├── language-selector.tsx                # i18n language picker (compact/full variants)
│   │   └── index.ts
│   ├── breadcrumbs/                # Breadcrumb navigation
│   │   ├── app-breadcrumbs.tsx     # Breadcrumbs + social share + "Talk to Founder" button
│   │   └── index.ts
│   ├── footer/                     # Footer components
│   │   ├── app-footer.tsx                    # Compact footer (version, copyright, status, links)
│   │   ├── app-footer-for-home-page.tsx      # Full footer (link grid, brand, social, status)
│   │   └── index.ts
│   ├── layout/                     # Page layout wrapper
│   │   ├── app-page-layout.tsx     # Combines topbar + breadcrumbs + content + footer
│   │   └── index.ts
│   ├── settings/                   # Settings components
│   │   ├── appearance-settings.tsx     # Theme (light/dark/system) + font size selector
│   │   ├── global-settings-page.tsx    # Master-detail settings page (extensible sections)
│   │   └── index.ts
│   ├── empty-state/                # Empty-state placeholder
│   │   ├── EmptyState.tsx           # Icon + title + description + optional action
│   │   └── index.ts
│   └── pages/                      # Full page components
│       ├── app-text-page.tsx       # Markdown/text content page (privacy, terms, etc.)
│       ├── app-sitemap-page.tsx    # Sitemap page with language selector + link grid
│       ├── login-page.tsx          # Email/password + Google sign-in page
│       └── index.ts
├── constants/
│   ├── languages.ts                # 16 default languages with flags, RTL detection
│   └── index.ts
├── utils/
│   └── index.ts                    # cn() utility (clsx + tailwind-merge)
├── i18n/
│   └── index.ts                    # initializeI18n(), getI18n(), i18n instance
├── test/
│   └── setup.ts                    # Vitest setup (@testing-library/jest-dom)
└── __tests__/                      # Test files
    ├── app-breadcrumbs-theme.test.tsx
    ├── app-breadcrumbs.test.tsx
    ├── app-footer.test.tsx
    ├── app-page-layout.test.tsx
    ├── app-sitemap-page.test.tsx
    ├── app-text-page.test.tsx
    ├── app-topbar.test.tsx
    ├── appearance-settings.test.tsx
    ├── auth-query-cache-reset.test.tsx
    ├── global-settings-page.test.tsx
    ├── language-selector.test.tsx
    ├── languages.test.ts
    └── login-page.test.tsx
```

## Key Components

### App Wrappers (Provider Stacks)

| Component | Description | Provides |
|-----------|-------------|----------|
| `SudobilityApp` | Base app shell | HelmetProvider, I18nextProvider, ThemeProvider, NetworkProvider, QueryClientProvider, ToastProvider, BrowserRouter, InfoBanner, PageTracker |
| `SudobilityAppWithFirebaseAuth` | + Firebase auth | All of above + AuthProvider, ApiProvider (Firebase ID token management) |

Import the Firebase-dependent wrapper from `@sudobility/building_blocks/firebase`.

> The entity-aware wrapper (`SudobilityAppWithFirebaseAuthAndEntities`) is **not** in this package — it lives in `@sudobility/entity_pages`, which layers entity + subscription wiring on top of `SudobilityAppWithFirebaseAuth`.

### TopBar Components

| Component | Description | Use Case |
|-----------|-------------|----------|
| `AppTopBar` | Base navigation bar with logo, nav items, language selector | Custom auth rendering via `renderAccountSection` |
| `AppTopBarWithFirebaseAuth` | TopBar + Firebase AuthAction component | Apps using Firebase authentication |
| `AppTopBarWithWallet` | TopBar + wallet connect/dropdown | Web3 apps with wallet auth (EVM/Solana) |
| `LanguageSelector` | i18n language picker dropdown | Two variants: `compact` (topbar) and `full` (settings) |

### Footer Components

| Component | Description | Use Case |
|-----------|-------------|----------|
| `AppFooter` | Compact sticky footer | App pages - version, copyright, status indicator, links |
| `AppFooterForHomePage` | Full footer with grid | Landing pages - link sections, brand, social links, status |

### Layout Components

| Component | Description | Use Case |
|-----------|-------------|----------|
| `AppPageLayout` | Full page wrapper | Combines topbar + breadcrumbs + content + footer with configurable maxWidth, padding, background |
| `AppBreadcrumbs` | Breadcrumb navigation | Page hierarchy with social share dropdown and "Talk to Founder" button |

### Settings Components

| Component | Description | Use Case |
|-----------|-------------|----------|
| `GlobalSettingsPage` | Master-detail settings layout | Appearance built-in as first section, extensible via `additionalSections` |
| `AppearanceSettings` | Theme and font size selects | Standalone or embedded in GlobalSettingsPage |

### Empty State

| Component | Description | Use Case |
|-----------|-------------|----------|
| `EmptyState` | Icon + title + description + optional action | Empty lists, no-results states, placeholder panels |

> **No subscription components here.** Pricing/subscription pages and providers (`AppPricingPage`, `AppSubscriptionsPage`, `LazySubscriptionProvider`, `SafeSubscriptionContext`, `SubscriptionProviderWrapper`) live in `@sudobility/subscription_pages`.

### Page Components

| Component | Description | Use Case |
|-----------|-------------|----------|
| `AppTextPage` | Structured text content page | Privacy policy, terms of service, docs (content/list/subsection types) |
| `AppSitemapPage` | Sitemap display with categories | SEO sitemap with language selector and quick links |
| `LoginPage` | Email/password + Google sign-in | Firebase auth login page with error handling |

### API Context

| Export | Description | Use Case |
|--------|-------------|----------|
| `ApiProvider` | Manages Firebase ID token and network client | Provides `useApi()` hook with token, userId, networkClient |
| `useApi()` | Access API context (throws if outside provider) | Authenticated API requests |
| `useApiSafe()` | Access API context (returns null if outside provider) | Optional API access |

## Development Commands

```bash
# Install dependencies
bun install

# Build the library (Vite + tsc declarations)
bun run build

# Development mode with watch
bun run dev

# Type checking
bun run typecheck        # or: bun run type-check

# Linting
bun run lint             # ESLint with max-warnings 0
bun run lint:fix         # Auto-fix ESLint issues

# Formatting
bun run format           # Format with Prettier
bun run format:check     # Check formatting

# Testing
bun run test             # Run tests once
bun run test:watch       # Watch mode
bun run test:ui          # Vitest UI

# Clean build artifacts
bun run clean

# Full verification
bun run typecheck && bun run lint && bun run test
```

## Architecture / Patterns

### Dual Entry Points

The library has two entry points to manage dependency trees:

- **`@sudobility/building_blocks`** (main): Core components with no hard dependency on auth-components, auth_lib, or di. Safe to import in any context.
- **`@sudobility/building_blocks/firebase`**: Firebase-auth-dependent exports (`SudobilityAppWithFirebaseAuth`, `ApiProvider`, `useApi`, `useApiSafe`). These require `@sudobility/components/auth` and related auth packages.

### Component Injection Pattern

Components avoid hard dependencies on optional packages by accepting components as props:

```typescript
// TopBar accepts AuthAction or WalletDropdownMenu as a prop
<AppTopBarWithFirebaseAuth AuthActionComponent={AuthAction} ... />
<AppTopBarWithWallet WalletDropdownMenuComponent={WalletDropdownMenu} ... />

// Footer accepts SystemStatusIndicator as a prop
<AppFooter StatusIndicatorComponent={SystemStatusIndicator} ... />
```

### Styling

- **Tailwind CSS** via `@sudobility/design` system tokens
- **`cn()` utility** (clsx + tailwind-merge) for conditional class merging
- **Dark mode** via `dark:` Tailwind variants throughout all components
- **Theme tokens**: `text-theme-*`, `bg-theme-*` classes for theming
- **class-variance-authority** (`cva`) for variant-driven styling (layout backgrounds, breadcrumb variants)
- **`@sudobility/design`** provides `GRADIENT_CLASSES` and `textVariants`

### Internationalization (i18n)

- Uses **i18next** + **react-i18next** + **i18next-http-backend** + **i18next-browser-languagedetector**
- 16 default languages (with RTL support for Arabic)
- Language detection order: URL path, localStorage, navigator
- Translation namespaces: common, home, pricing, docs, dashboard, auth, privacy, terms, settings
- Components accept `t` function props for translatable labels (e.g., `AppearanceSettings`, `GlobalSettingsPage`)

### Analytics Tracking

All major interactive components support optional analytics via an `onTrack` callback:

```typescript
onTrack?: (params: AnalyticsTrackingParams) => void;

interface AnalyticsTrackingParams {
  eventType: 'button_click' | 'link_click' | 'navigation' | 'settings_change' | 'subscription_action' | 'page_view';
  componentName: string;
  label: string;
  params?: Record<string, unknown>;
}
```

Components with analytics: `GlobalSettingsPage`, `AppFooter`, `AppFooterForHomePage`.

### Provider Composition (App Wrappers)

The `SudobilityApp*` wrappers compose providers in this order (outermost to innermost):

```
HelmetProvider > I18nextProvider > ThemeProvider > NetworkProvider > QueryClientProvider > ToastProvider > [AppProviders] > BrowserRouter > [PageTracker + Suspense + ToastContainer + InfoBanner]
```

`SudobilityAppWithFirebaseAuth` adds: `AuthProvider > ApiProvider` inside AppProviders.

Entity/subscription providers are composed by `@sudobility/entity_pages` and `@sudobility/subscription_pages` on top of this wrapper — they are not part of `building_blocks`.

### TypeScript

- **Strict mode** enabled with `noUnusedLocals`, `noUnusedParameters`
- **Path alias**: `@/*` maps to `./src/*`
- **Props naming**: `{ComponentName}Props` (e.g., `AppTopBarProps`)
- **Structural typing**: `QueryClientLike` and `I18nLike` used in app wrappers to avoid cross-package type conflicts with bun link
- All types centralized in `src/types.ts` and re-exported from main entry

### File Naming Conventions

- **kebab-case** (`app-footer.tsx`, `app-topbar.tsx`, `login-page.tsx`) is the standard for most component files
- **PascalCase** (`SudobilityApp.tsx`, `SudobilityAppWithFirebaseAuth.tsx`, `EmptyState.tsx`) is reserved for top-level app wrapper components and a few standalone components
- Tests: `{component-name}.test.tsx` in `src/__tests__/`
- Index files: barrel re-exports for all public APIs
- Each component directory has its own `index.ts`
- Shared utilities within a directory: `shared.tsx` (e.g., `footer/shared.tsx`)
- **Note**: Do not rename existing files. This convention documents the current state. New components should use kebab-case unless they are app wrapper components.

## Common Tasks

### Add a new component

1. Create directory: `src/components/{component-name}/`
2. Create component file with Props interface (JSDoc + `@ai-context` tags)
3. Create `index.ts` that re-exports component and types
4. Update `src/components/index.ts` to include new directory
5. If it should be in the main entry, update `src/index.ts`
6. Add tests in `src/__tests__/{component-name}.test.tsx`
7. Verify: `bun run typecheck && bun run lint && bun run test`

### Add analytics tracking to a component

1. Import: `import type { AnalyticsTrackingParams } from '../../types';`
2. Add prop: `onTrack?: (params: AnalyticsTrackingParams) => void;`
3. Create track helper with `useCallback`:
   ```typescript
   const track = useCallback((label: string, params?: Record<string, unknown>) => {
     onTrack?.({ eventType: 'button_click', componentName: 'MyComponent', label, params });
   }, [onTrack]);
   ```
4. Call `track()` on user interactions

### Add a new settings section to GlobalSettingsPage

Pass `additionalSections` prop with `SettingsSectionConfig` objects:
```typescript
<GlobalSettingsPage
  additionalSections={[{
    id: 'notifications',
    icon: BellIcon,
    label: 'Notifications',
    description: 'Manage notification preferences',
    content: <NotificationSettings />,
  }]}
  ...
/>
```

### Add a new language

Edit `src/constants/languages.ts` and add to `DEFAULT_LANGUAGES` array. If the language is RTL, add its code to `RTL_LANGUAGES`.

### Add a new app wrapper variant

Extend `SudobilityApp` or `SudobilityAppWithFirebaseAuth` and compose additional providers via the `AppProviders` prop pattern. (Entity/subscription-aware variants belong in `@sudobility/entity_pages` / `@sudobility/subscription_pages`, not here.)

## Build Output

```
dist/
├── index.js        # Main ESM bundle (core components)
├── index.js.map    # Source map
├── index.d.ts      # TypeScript declarations
├── firebase.js     # Firebase entry bundle (auth-dependent components)
├── firebase.js.map # Source map
└── firebase.d.ts   # TypeScript declarations
```

The library is tree-shakeable (ESM only), not minified, with source maps enabled. All `@sudobility/*`, `react`, `firebase`, and other peer dependencies are externalized.

## Peer / Key Dependencies

### Required Peer Dependencies

The two `@sudobility` ranges below are rewritten to the latest published
version by `scripts/push_all.sh` on every release — `package.json` is the
source of truth for them, not this table.

| Package | Version | Purpose |
|---------|---------|---------|
| `react` / `react-dom` | ^18.0.0 or ^19.0.0 | UI framework |
| `@sudobility/components` | ^5.3.17 | Base UI components (Topbar, Footer, Section, Select, MasterDetailLayout, etc.) |
| `@sudobility/design` | ^1.1.52 | Design tokens, GRADIENT_CLASSES, textVariants |
| `@heroicons/react` | ^2.0.0 | Icon library |
| `@tanstack/react-query` | ^5.0.0 | Data fetching / caching |
| `class-variance-authority` | ^0.7.0 | Variant-driven styling |
| `clsx` | ^2.0.0 | Conditional classnames |
| `tailwind-merge` | ^2.0.0 or ^3.0.0 | Tailwind class deduplication |
| `i18next` | ^23.0.0 - ^25.0.0 | Internationalization core |
| `react-i18next` | ^14.0.0 - ^16.0.0 | React i18n bindings |
| `react-helmet-async` | ^2.0.0 | Head/SEO management |
| `react-router-dom` | ^6.0.0 or ^7.0.0 | Client-side routing |

### Optional Peer Dependencies (Feature-Specific)

| Package | Required For |
|---------|-------------|
| `firebase` (^11 or ^12) | `LoginPage`, Firebase auth features |
| `@sudobility/auth-components` | `AppTopBarWithFirebaseAuth`, `SudobilityAppWithFirebaseAuth` |
| `@sudobility/auth_lib` | `SudobilityAppWithFirebaseAuth`, `ApiProvider` |
| `@sudobility/web3-components` | `AppTopBarWithWallet` |
| `@sudobility/devops-components` | `SystemStatusIndicator` in footers, `NetworkProvider` in app wrappers |
| `@sudobility/di` / `@sudobility/di_web` | Service locator for InfoBanner, Firebase services |
| `@sudobility/types` | Shared TypeScript enums (Theme, FontSize, InfoType, RateLimitsConfigData) |
| `i18next-browser-languagedetector` | Auto language detection in `initializeI18n` |
| `i18next-http-backend` | Loading translation files via HTTP in `initializeI18n` |

> **Not dependencies of this package:** `@sudobility/entity_client`, `@sudobility/subscription_lib`, `@sudobility/subscription_pages`, and `@sudobility/subscription-components`. They belong to the entity/subscription packages (`@sudobility/entity_pages`, `@sudobility/subscription_pages`) that build on top of `building_blocks`.

## Testing Guidelines

Tests live in `src/__tests__/`. Run with `bun run test`.

```bash
bun run test                                  # All tests
bun run test src/__tests__/app-footer         # Specific file
bun run test -- --coverage                    # With coverage
```

Test patterns:
- Render with required props, assert visible text
- Test prop variations (optional props, conditional rendering)
- Test user interactions via `@testing-library/user-event`
- Mock external components passed as props (e.g., `AuthActionComponent`)

## Environment Variables

| Variable | Used By | Purpose |
|----------|---------|---------|
| `VITE_API_URL` | `ApiProvider` | Base API URL |

> RevenueCat/subscription env vars (`VITE_REVENUECAT_API_KEY*`) are consumed by `@sudobility/subscription_pages`, not this package.

## Troubleshooting

**"Cannot find module '@sudobility/components'"** -- Ensure peer dependencies are installed in the consuming app. Check that versions match peer dependency requirements.

**"useApi must be used within an ApiProvider"** -- Wrap your component tree with `ApiProvider` or use one of the Firebase app wrappers that include it. Use `useApiSafe()` for optional access.

**Tests failing after changes** -- Run `bun run typecheck` first to catch type errors. Check if test mocks need updating for new props.

**Import errors from `@sudobility/building_blocks/firebase`** -- Ensure `@sudobility/auth-components`, `@sudobility/auth_lib`, and `@sudobility/di` are installed. These are optional peer dependencies required only for the `/firebase` entry point.

## Git Workflow

- Do not use feature branches for code changes. Always stay on the current branch.
