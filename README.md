# @sudobility/building_blocks

Higher-level shared UI building blocks for Sudobility apps. These components integrate with authentication, wallet connection, i18n, routing, and analytics tracking.

This package intentionally holds only common, broadly reusable building blocks. It has **no** dependency on entities or subscriptions: the entity-aware app wrapper lives in `@sudobility/entity_pages`, and subscription/pricing screens live in `@sudobility/subscription_pages`. Apps compose those on top of `building_blocks`.

## Installation

`@sudobility/*` packages are published to GitHub Packages. The repo's `.npmrc` already points the scope at `https://npm.pkg.github.com`; a consuming app needs the same registry mapping (and an auth token) configured.

```bash
bun add @sudobility/building_blocks
```

## Entry Points

- `@sudobility/building_blocks` — core components with no hard auth dependency.
- `@sudobility/building_blocks/firebase` — Firebase-auth-dependent exports (`SudobilityAppWithFirebaseAuth`, `ApiProvider`, `useApi`, `useApiSafe`). Requires `@sudobility/components/auth` and related auth packages.

## Peer Dependencies

Required:
- `@sudobility/components` - Base UI components
- `@sudobility/design` - Design tokens and styling
- `@heroicons/react` - Icon library
- `react` / `react-dom` (^18.0.0 || ^19.0.0)
- `@tanstack/react-query`, `react-router-dom`, `react-helmet-async` - Data/routing/head
- `i18next`, `react-i18next` - Internationalization
- `class-variance-authority`, `clsx`, `tailwind-merge` - Styling utilities

Optional (for specific features):
- `firebase` - `LoginPage` and Firebase auth features
- `@sudobility/auth_lib` - `SudobilityAppWithFirebaseAuth`, `ApiProvider`
- `@sudobility/web3-components` - wallet connection (`AppTopBarWithWallet`)
- `@sudobility/di` / `@sudobility/di_web` - service locator, `InfoBanner`, `NetworkProvider`
- `@sudobility/types` - `Theme`, `FontSize` enums
- `i18next-browser-languagedetector`, `i18next-http-backend` - auto language detection / HTTP translation loading

> Components that need `AuthAction`, `WalletDropdownMenu`, or `SystemStatusIndicator` receive them as props (component-injection pattern) rather than importing them, so those packages stay optional. `AuthAction` and `SystemStatusIndicator` come from `@sudobility/components/auth` and `@sudobility/components/devops`; `WalletDropdownMenu` comes from `@sudobility/web3-components`.

## Development

```bash
bun install            # install dependencies
bun run build          # Vite lib build + tsc declarations + fix-esm-imports
bun run dev            # rebuild on change (vite build --watch)
bun run typecheck      # tsc --noEmit
bun run lint           # ESLint (max-warnings 0); lint:fix to auto-fix
bun run format         # Prettier write; format:check to verify
bun run test:unit      # run tests once (vitest run)
bun run test:watch     # tests in watch mode
bun run test:ui        # Vitest UI
```

## Components

### App Wrappers (Provider Stacks)

`SudobilityApp` is the base app shell, composing HelmetProvider, I18nextProvider, ThemeProvider, NetworkProvider, QueryClientProvider, ToastProvider, and BrowserRouter (plus InfoBanner and a page tracker).

```tsx
import { SudobilityApp } from '@sudobility/building_blocks';
// Firebase-auth variant (adds AuthProvider + ApiProvider):
import { SudobilityAppWithFirebaseAuth } from '@sudobility/building_blocks/firebase';
```

### TopBar Components

#### AppTopBar (Base)
Base topbar with logo, menu items, language selector, and render prop for auth.

```tsx
import { AppTopBar } from '@sudobility/building_blocks';
import { Cog6ToothIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

<AppTopBar
  logo={{
    src: '/logo.png',
    appName: 'My App',
    onClick: () => navigate('/'),
  }}
  menuItems={[
    { id: 'docs', label: 'Docs', icon: DocumentTextIcon, href: '/docs' },
    { id: 'settings', label: 'Settings', icon: Cog6ToothIcon, href: '/settings' },
  ]}
  currentLanguage="en"
  onLanguageChange={(lang) => switchLanguage(lang)}
  renderAccountSection={() => <MyAuthButton />}
  LinkComponent={LocalizedLink}
/>
```

#### AppTopBarWithFirebaseAuth
TopBar with Firebase authentication. The `AuthAction` component is injected as a prop.

```tsx
import { AppTopBarWithFirebaseAuth } from '@sudobility/building_blocks';
import { AuthAction } from '@sudobility/components/auth';

<AppTopBarWithFirebaseAuth
  logo={{ src: '/logo.png', appName: 'My App' }}
  menuItems={menuItems}
  AuthActionComponent={AuthAction}
  onLoginClick={() => navigate('/login')}
  authenticatedMenuItems={[
    { id: 'dashboard', label: 'Dashboard', onClick: () => navigate('/dashboard') },
  ]}
/>
```

#### AppTopBarWithWallet
TopBar with wallet connection via @sudobility/web3-components.

```tsx
import { AppTopBarWithWallet } from '@sudobility/building_blocks';
import { WalletDropdownMenu } from '@sudobility/web3-components';

<AppTopBarWithWallet
  logo={{ src: '/logo.png', appName: 'My App' }}
  menuItems={menuItems}
  WalletDropdownMenuComponent={WalletDropdownMenu}
  isConnected={isConnected}
  walletAddress={walletAddress}
  authStatus={authStatus}
  onConnect={() => navigate('/connect')}
  onDisconnect={handleDisconnect}
  walletMenuItems={walletMenuItems}
/>
```

### Breadcrumbs

#### AppBreadcrumbs
Breadcrumbs with social share and "Talk to Founder" button.

```tsx
import { AppBreadcrumbs } from '@sudobility/building_blocks';

<AppBreadcrumbs
  items={[
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'Widget', current: true },
  ]}
  shareConfig={{
    title: 'Check out this widget',
    description: 'Amazing widget for your needs',
    hashtags: ['widget', 'product'],
  }}
  talkToFounder={{
    meetingUrl: 'https://calendly.com/founder/30min',
    buttonText: 'Book a call',
  }}
/>
```

### Footer Components

#### AppFooter (Compact)
Compact footer for app pages with sticky positioning.

```tsx
import { AppFooter } from '@sudobility/building_blocks';
import { SystemStatusIndicator } from '@sudobility/components/devops';

<AppFooter
  version="1.0.0"
  companyName="Sudobility Inc."
  companyUrl="/"
  statusIndicator={{
    statusPageUrl: 'https://status.example.com',
  }}
  StatusIndicatorComponent={SystemStatusIndicator}
  links={[
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ]}
  onTrack={handleAnalytics}
  sticky
/>
```

#### AppFooterForHomePage (Full)
Full footer for home/landing pages with link sections.

```tsx
import { AppFooterForHomePage } from '@sudobility/building_blocks';

<AppFooterForHomePage
  logo={{ appName: 'My App' }}
  linkSections={[
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '/features' },
        { label: 'Pricing', href: '/pricing' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
      ],
    },
  ]}
  socialLinks={{
    twitterUrl: 'https://twitter.com/myapp',
    discordUrl: 'https://discord.gg/myapp',
  }}
  version="1.0.0"
  companyName="Sudobility Inc."
  description="Building the future of web3 communication"
  onTrack={handleAnalytics}
/>
```

### Layout

#### AppPageLayout
Layout wrapper combining TopBar, Breadcrumbs, Content, and Footer.

```tsx
import { AppPageLayout, AppTopBarWithFirebaseAuth, AppFooter } from '@sudobility/building_blocks';

<AppPageLayout
  topBar={<AppTopBarWithFirebaseAuth {...topBarProps} />}
  breadcrumbs={{
    items: breadcrumbItems,
    shareConfig: shareConfig,
  }}
  footer={<AppFooter {...footerProps} />}
  maxWidth="7xl"
  background="default"
>
  <h1>Page Content</h1>
</AppPageLayout>
```

### Settings Components

#### GlobalSettingsPage
Master-detail settings page with extensible sections.

```tsx
import { GlobalSettingsPage } from '@sudobility/building_blocks';

<GlobalSettingsPage
  theme={theme}
  fontSize={fontSize}
  onThemeChange={setTheme}
  onFontSizeChange={setFontSize}
  additionalSections={[
    {
      id: 'notifications',
      icon: BellIcon,
      label: 'Notifications',
      description: 'Manage notification preferences',
      content: <NotificationSettings />,
    },
  ]}
  onTrack={handleAnalytics}
/>
```

### Empty State

#### EmptyState
Icon + title + description + optional action, for empty lists and no-results states.

```tsx
import { EmptyState } from '@sudobility/building_blocks';
import { InboxIcon } from '@heroicons/react/24/outline';

<EmptyState
  icon={InboxIcon}
  title="No messages"
  description="You're all caught up."
/>
```

> **Subscription/pricing components are not in this package.** `AppPricingPage` and
> related providers moved to `@sudobility/subscription_pages`.

### Page Components

#### AppTextPage
Markdown/HTML content page for static content.

```tsx
import { AppTextPage } from '@sudobility/building_blocks';

<AppTextPage
  title="Privacy Policy"
  content={markdownContent}
  lastUpdated="2024-01-01"
/>
```

#### AppSitemapPage
SEO-friendly sitemap page.

```tsx
import { AppSitemapPage } from '@sudobility/building_blocks';

<AppSitemapPage
  sections={sitemapSections}
  LinkComponent={LocalizedLink}
/>
```

#### LoginPage
Email/password + Google sign-in page for Firebase auth (handles auth error display).

```tsx
import { LoginPage } from '@sudobility/building_blocks';

<LoginPage
  onEmailSignIn={handleEmailSignIn}
  onGoogleSignIn={handleGoogleSignIn}
  onSuccess={() => navigate('/dashboard')}
/>
```

## Analytics Tracking

All major components support optional analytics tracking via the `onTrack` callback:

```tsx
import type { AnalyticsTrackingParams } from '@sudobility/building_blocks';

const handleAnalytics = (params: AnalyticsTrackingParams) => {
  // params.eventType: 'button_click' | 'link_click' | 'navigation' | 'settings_change' | 'subscription_action' | 'page_view'
  // params.componentName: 'AppFooter' | 'AppFooterForHomePage' | 'GlobalSettingsPage'
  // params.label: 'footer_link_clicked' | 'theme_changed' | ...
  // params.params: { link_href, theme, ... }

  analytics.track(params.label, {
    component: params.componentName,
    ...params.params,
  });
};

<AppFooter onTrack={handleAnalytics} {...props} />
<GlobalSettingsPage onTrack={handleAnalytics} {...props} />
```

**Components with analytics support:**
- `AppFooter` - tracks link clicks
- `AppFooterForHomePage` - tracks link clicks with section info
- `GlobalSettingsPage` - tracks theme/font changes, section navigation

## Constants

### Default Languages
15 languages with flags are included by default:

```tsx
import { DEFAULT_LANGUAGES } from '@sudobility/building_blocks';
// ['en', 'de', 'es', 'fr', 'it', 'ja', 'ko', 'pt', 'ru', 'sv', 'th', 'uk', 'vi', 'zh', 'zh-hant']
```

RTL support is available via `RTL_LANGUAGES` / `isRTL()`, but `RTL_LANGUAGES` is empty by default (no RTL languages shipped).

## TypeScript Types

All props interfaces and utility types are exported:

```tsx
import type {
  // Component Props
  AppTopBarProps,
  AppFooterProps,
  AppFooterForHomePageProps,
  GlobalSettingsPageProps,

  // Configuration Types
  MenuItemConfig,
  LogoConfig,
  FooterLinkSection,
  SocialLinksConfig,
  StatusIndicatorConfig,
  ShareConfig,

  // Analytics
  AnalyticsTrackingParams,
  AnalyticsEventType,

  // Layout
  MaxWidth,
  ContentPadding,
  BackgroundVariant,
} from '@sudobility/building_blocks';
```

## Features

- **Responsive**: All components support mobile with hamburger menu
- **Dark Mode**: Full dark mode support via Tailwind CSS
- **i18n Ready**: Language selector with 15 default languages
- **Flexible Auth**: Support for Firebase auth or wallet connection
- **Analytics Ready**: Optional tracking callbacks for all user interactions
- **Customizable**: All components accept custom classNames and Link components
- **Tree-shakeable**: ESM only, optimized for modern bundlers

## License

BUSL-1.1
