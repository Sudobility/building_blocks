/**
 * SudobilityAppWithFirebaseAuth - App wrapper with Firebase authentication
 *
 * Extends SudobilityApp with:
 * - An app-provided auth provider (the `AuthProviderWrapper` prop). The auth
 *   *logic* lives in `@sudobility/auth_lib` (each app builds its provider with
 *   `createFirebaseAuthContext`); `@sudobility/components` is UI only.
 * - ApiProvider for network/token management (built-in default)
 * - Query cache reset when the signed-in user changes
 *
 * `initializeFirebaseAuth()` runs synchronously in render, before the inner
 * `ApiProvider` mounts, so `ApiProvider`'s `getFirebaseAuth()` sees an
 * initialised Firebase app on first render (child effects run before parent
 * effects, so the provider cannot rely on the auth provider's own effect to
 * initialise Firebase first). The app's `AuthProvider` reuses that same app.
 */
import { ComponentType, ReactNode } from 'react';
import { SudobilityApp, SudobilityAppProps } from './SudobilityApp';
import { AuthQueryCacheReset } from './AuthQueryCacheReset';
import { initializeFirebaseAuth } from '@sudobility/auth_lib';
import { ApiProvider } from '../api';

export interface SudobilityAppWithFirebaseAuthProps extends Omit<
  SudobilityAppProps,
  'AppProviders' | 'RouterWrapper'
> {
  /**
   * The app's auth provider component — typically the `AuthProvider` returned
   * by `createFirebaseAuthContext` (`@sudobility/auth_lib`). Mounted around the
   * whole app so `useAuth()`/`useIsLoggedIn()` work everywhere.
   */
  AuthProviderWrapper: ComponentType<{ children: ReactNode }>;

  /**
   * Custom ApiProvider component (optional).
   * Defaults to built-in ApiProvider that manages Firebase ID token.
   * Set to false to disable the built-in ApiProvider.
   */
  ApiProvider?: ComponentType<{ children: ReactNode }> | false;

  /**
   * Additional providers to wrap around the router content.
   * These are rendered inside ApiProvider but outside BrowserRouter.
   */
  AppProviders?: ComponentType<{ children: ReactNode }>;

  /**
   * Custom router wrapper component (optional).
   * Defaults to BrowserRouter. Pass a fragment wrapper `({ children }) => <>{children}</>`
   * to skip the router entirely (useful when nesting inside an existing router).
   */
  RouterWrapper?: ComponentType<{ children: ReactNode }>;

  /**
   * Whether running in test/sandbox mode (optional).
   * Passed to ApiProvider. Defaults to false.
   */
  testMode?: boolean;

  /**
   * Base URL for API requests (optional).
   * Passed to ApiProvider. Defaults to VITE_API_URL env var.
   */
  baseUrl?: string;
}

/**
 * SudobilityAppWithFirebaseAuth - App wrapper with Firebase authentication
 *
 * @example
 * ```tsx
 * import { SudobilityAppWithFirebaseAuth } from '@sudobility/building_blocks';
 * import { AuthProvider } from '@/context/AuthContext'; // auth_lib-based
 *
 * function App() {
 *   return (
 *     <SudobilityAppWithFirebaseAuth AuthProviderWrapper={AuthProvider}>
 *       <Routes>
 *         <Route path="/" element={<HomePage />} />
 *       </Routes>
 *     </SudobilityAppWithFirebaseAuth>
 *   );
 * }
 * ```
 */
export function SudobilityAppWithFirebaseAuth({
  AuthProviderWrapper,
  ApiProvider: ApiProviderProp,
  AppProviders,
  RouterWrapper,
  testMode = false,
  baseUrl,
  ...baseProps
}: SudobilityAppWithFirebaseAuthProps) {
  // Create a combined providers component that includes auth and api
  const CombinedProviders: ComponentType<{ children: ReactNode }> = ({
    children,
  }) => {
    // Bring Firebase (and any regional proxy) up synchronously, before the
    // inner ApiProvider renders — it reads getFirebaseAuth() on mount.
    // Idempotent; the app's AuthProvider reuses the same app.
    initializeFirebaseAuth();

    let content: ReactNode = (
      <>
        <AuthQueryCacheReset />
        {children}
      </>
    );

    // Wrap with AppProviders if provided
    if (AppProviders) {
      content = <AppProviders>{content}</AppProviders>;
    }

    // Wrap with ApiProvider (custom, default, or disabled)
    if (ApiProviderProp === false) {
      // Explicitly disabled
    } else if (ApiProviderProp) {
      content = <ApiProviderProp>{content}</ApiProviderProp>;
    } else {
      // Default ApiProvider
      content = (
        <ApiProvider baseUrl={baseUrl} testMode={testMode}>
          {content}
        </ApiProvider>
      );
    }

    // Mount the app-provided auth provider around everything.
    return <AuthProviderWrapper>{content}</AuthProviderWrapper>;
  };

  return (
    <SudobilityApp
      {...baseProps}
      AppProviders={CombinedProviders}
      RouterWrapper={RouterWrapper}
    />
  );
}

export default SudobilityAppWithFirebaseAuth;
