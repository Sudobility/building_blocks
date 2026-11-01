/**
 * SudobilityApp - Base app wrapper for all Sudobility apps
 *
 * Provides common infrastructure with sensible defaults:
 * - HelmetProvider for SEO
 * - I18nextProvider for localization
 * - ThemeProvider for theming (built-in default)
 * - NetworkProvider for online/offline status (built-in default)
 * - QueryClientProvider for TanStack Query (built-in default)
 * - ToastProvider for notifications (built-in default)
 * - BrowserRouter for routing
 * - InfoBanner for system notifications (built-in default)
 *
 * All providers have sensible defaults - only pass props to override.
 */
import {
  Suspense,
  ComponentType,
  ReactNode,
  useMemo,
  useRef,
  useEffect,
} from 'react';
import { BrowserRouter } from 'react-router-dom';
import {
  QueryClient,
  QueryClientProvider,
  type QueryClient as QueryClientType,
} from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { I18nextProvider } from 'react-i18next';
import type { i18n } from 'i18next';
import { useLocation } from 'react-router-dom';
import { NetworkProvider } from '@sudobility/components/devops';
import { getNetworkService, getFirebaseService } from '@sudobility/di/web';
import { InfoBanner } from '@sudobility/di_web';
import {
  ThemeProvider as SharedThemeProvider,
  Theme,
  FontSize,
} from '@sudobility/components';
import {
  ToastProvider as SharedToastProvider,
  ToastContainer as SharedToastContainer,
  useToast,
} from '@sudobility/components/ui/toast';
import { colors } from '@sudobility/design';

/**
 * QueryClient type that's compatible across different package versions.
 * Uses structural typing to avoid cross-package type conflicts when using bun link.
 */
type QueryClientLike = {
  getDefaultOptions: () => unknown;
  getQueryCache: () => unknown;
  getMutationCache: () => unknown;
};

/**
 * i18n type that's compatible across different package versions.
 * Uses structural typing to avoid cross-package type conflicts when using bun link.
 */
type I18nLike = {
  language: string;
  languages: readonly string[];

  t: (...args: any[]) => any;
};

export interface SudobilityAppProps {
  /** App routes and content */
  children: ReactNode;

  /**
   * i18next instance for localization.
   * Each app must pass its own configured i18n instance.
   */
  i18n: I18nLike;

  /**
   * TanStack Query client instance (optional).
   * Defaults to a QueryClient with sensible settings.
   */
  queryClient?: QueryClientLike;

  /**
   * Custom ThemeProvider component (optional).
   * Defaults to SharedThemeProvider from @sudobility/components.
   */
  ThemeProvider?: ComponentType<{ children: ReactNode }>;

  /**
   * Custom ToastProvider component (optional).
   * Defaults to ToastProvider from @sudobility/components.
   */
  ToastProvider?: ComponentType<{ children: ReactNode }>;

  /**
   * Toast container component rendered after routes (optional).
   * Defaults to a built-in container that renders toasts from context at bottom-right.
   */
  ToastContainer?: ComponentType;

  /**
   * Whether to show the InfoBanner for notifications/errors.
   * Defaults to true. Set to false to disable.
   */
  showInfoBanner?: boolean;

  /** Custom loading fallback for Suspense (optional) */
  LoadingFallback?: ComponentType;

  /**
   * Custom NetworkProvider component (optional).
   * By default, uses the built-in NetworkProvider with getNetworkService().
   * Set to false to disable network status tracking entirely.
   */
  NetworkProvider?: ComponentType<{ children: ReactNode }> | false;

  /**
   * Page tracker component for analytics (optional).
   * By default, uses Firebase Analytics to track page_view events.
   * Pass a custom component to override, or false to disable.
   */
  PageTracker?: ComponentType | false;

  /**
   * Additional providers to wrap around the router content.
   * These are rendered inside ToastProvider but outside BrowserRouter.
   * Use this for app-specific providers like ApiProvider, SettingsProvider, etc.
   */
  AppProviders?: ComponentType<{ children: ReactNode }>;

  /**
   * Storage key prefix for theme persistence (optional).
   * Defaults to "sudobility". Used for localStorage keys (e.g., "sudobility-theme").
   * Since localStorage is origin-scoped, apps on different domains don't need
   * different prefixes. Only override if running multiple app instances on the
   * same origin or if you want app-specific debugging visibility.
   */
  storageKeyPrefix?: string;

  /**
   * Custom router wrapper component (optional).
   * Defaults to BrowserRouter. Pass a fragment wrapper `({ children }) => <>{children}</>`
   * to skip the router entirely (useful when nesting inside an existing router).
   */
  RouterWrapper?: ComponentType<{ children: ReactNode }>;
}

/**
 * Default loading fallback component
 */
function DefaultLoadingFallback() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-theme-bg-primary'>
      <div
        className={`animate-spin rounded-full h-8 w-8 border-b-2 border-current ${colors.component.alert.info.icon}`}
      />
    </div>
  );
}

/**
 * Default page tracker using Firebase Analytics.
 * Tracks page_view events on route changes.
 */
function DefaultPageTracker(): null {
  const location = useLocation();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    const currentPath = location.pathname;

    // Skip if same path
    if (previousPathRef.current === currentPath) {
      return;
    }

    previousPathRef.current = currentPath;

    // Track page view via Firebase Analytics
    try {
      const firebaseService = getFirebaseService();
      if (firebaseService?.analytics?.isSupported()) {
        firebaseService.analytics.logEvent('page_view', {
          page_path: currentPath,
          page_location: window.location.href,
        });
      }
    } catch {
      // Firebase not configured - silently skip tracking
    }
  }, [location.pathname]);

  return null;
}

/**
 * Default network provider that uses getNetworkService()
 */
function DefaultNetworkProvider({ children }: { children: ReactNode }) {
  const networkService = useMemo(() => getNetworkService(), []);
  return (
    <NetworkProvider networkService={networkService}>
      {children}
    </NetworkProvider>
  );
}

/**
 * Create default QueryClient with sensible settings
 */
function createDefaultQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        // Smart retry: don't retry on 4xx client errors, retry up to 3 times otherwise
        retry: (failureCount, error: unknown) => {
          const statusCode = (error as { statusCode?: number })?.statusCode;
          if (statusCode && statusCode >= 400 && statusCode < 500) {
            return false;
          }
          return failureCount < 3;
        },
        // Exponential backoff: 1s, 2s, 4s... up to 30s
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: true,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Singleton default QueryClient
let defaultQueryClient: QueryClient | null = null;
function getDefaultQueryClient(): QueryClient {
  if (!defaultQueryClient) {
    defaultQueryClient = createDefaultQueryClient();
  }
  return defaultQueryClient;
}

/**
 * Default theme provider using SharedThemeProvider from @sudobility/components
 */
function createDefaultThemeProvider(storageKeyPrefix: string) {
  return function DefaultThemeProvider({ children }: { children: ReactNode }) {
    return (
      <SharedThemeProvider
        themeStorageKey={`${storageKeyPrefix}-theme`}
        fontSizeStorageKey={`${storageKeyPrefix}-font-size`}
        defaultTheme={Theme.LIGHT}
        defaultFontSize={FontSize.MEDIUM}
      >
        {children}
      </SharedThemeProvider>
    );
  };
}

/**
 * Default toast provider using SharedToastProvider from @sudobility/components
 */
function DefaultToastProvider({ children }: { children: ReactNode }) {
  return <SharedToastProvider>{children}</SharedToastProvider>;
}

/**
 * Default toast container that renders toasts from context.
 * Wraps SharedToastContainer with useToast consumer.
 */
function DefaultToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <SharedToastContainer
      toasts={toasts}
      onDismiss={removeToast}
      position='bottom-right'
    />
  );
}

/**
 * SudobilityApp - Base app wrapper for all Sudobility apps
 *
 * @example
 * ```tsx
 * // Minimal usage - only i18n is required
 * import { SudobilityApp } from '@sudobility/building_blocks';
 * import i18n from './i18n';
 *
 * function App() {
 *   return (
 *     <SudobilityApp i18n={i18n}>
 *       <Routes>
 *         <Route path="/" element={<HomePage />} />
 *       </Routes>
 *     </SudobilityApp>
 *   );
 * }
 *
 * // With custom providers
 * function App() {
 *   return (
 *     <SudobilityApp
 *       i18n={i18n}
 *       ThemeProvider={MyCustomThemeProvider}
 *       AppProviders={ApiProvider}
 *       storageKeyPrefix="myapp"
 *     >
 *       <Routes>
 *         <Route path="/" element={<HomePage />} />
 *       </Routes>
 *     </SudobilityApp>
 *   );
 * }
 * ```
 */
export function SudobilityApp({
  children,
  i18n: i18nInstance,
  queryClient,
  ThemeProvider: ThemeProviderProp,
  ToastProvider: ToastProviderProp,
  ToastContainer,
  showInfoBanner = true,
  LoadingFallback = DefaultLoadingFallback,
  NetworkProvider: NetworkProviderProp,
  PageTracker: PageTrackerProp,
  AppProviders,
  storageKeyPrefix = 'sudobility',
  RouterWrapper,
}: SudobilityAppProps) {
  // Determine which providers to use (custom or default)
  const NetworkProviderComponent =
    NetworkProviderProp === false
      ? null
      : (NetworkProviderProp ?? DefaultNetworkProvider);

  const PageTrackerComponent =
    PageTrackerProp === false ? null : (PageTrackerProp ?? DefaultPageTracker);

  const ThemeProviderComponent =
    ThemeProviderProp ?? createDefaultThemeProvider(storageKeyPrefix);

  const ToastProviderComponent = ToastProviderProp ?? DefaultToastProvider;

  const ToastContainerComponent = ToastContainer ?? DefaultToastContainer;

  const queryClientInstance = queryClient ?? getDefaultQueryClient();

  // Use custom RouterWrapper or default BrowserRouter
  const RouterWrapperComponent = RouterWrapper ?? BrowserRouter;

  // Build the router content
  let routerContent: ReactNode = (
    <>
      {PageTrackerComponent && <PageTrackerComponent />}
      <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
      <ToastContainerComponent />
      {showInfoBanner && <InfoBanner />}
    </>
  );

  // Wrap with Router
  routerContent = (
    <RouterWrapperComponent>{routerContent}</RouterWrapperComponent>
  );

  // Wrap with AppProviders if provided
  if (AppProviders) {
    routerContent = <AppProviders>{routerContent}</AppProviders>;
  }

  // Wrap with ToastProvider
  routerContent = (
    <ToastProviderComponent>{routerContent}</ToastProviderComponent>
  );

  // Wrap with QueryClientProvider
  routerContent = (
    <QueryClientProvider client={queryClientInstance as QueryClientType}>
      {routerContent}
    </QueryClientProvider>
  );

  // Wrap with NetworkProvider (uses default if not explicitly disabled)
  if (NetworkProviderComponent) {
    routerContent = (
      <NetworkProviderComponent>{routerContent}</NetworkProviderComponent>
    );
  }

  // Wrap with ThemeProvider
  routerContent = (
    <ThemeProviderComponent>{routerContent}</ThemeProviderComponent>
  );

  // Wrap with I18nextProvider
  routerContent = (
    <I18nextProvider i18n={i18nInstance as i18n}>
      {routerContent}
    </I18nextProvider>
  );

  // Wrap with HelmetProvider
  return <HelmetProvider>{routerContent}</HelmetProvider>;
}

export default SudobilityApp;
