/**
 * SudobilityAppWithFirebaseAuthAndEntities - App wrapper with Firebase auth and entity support
 *
 * Extends SudobilityAppWithFirebaseAuth with:
 * - AuthAwareEntityProvider that connects entity context to auth state (built-in default)
 * - EntityAwareSubscriptionProvider that connects subscription to entity (built-in default)
 */
import { ComponentType, ReactNode, useMemo } from 'react';
import {
  SudobilityAppWithFirebaseAuth,
  SudobilityAppWithFirebaseAuthProps,
} from './SudobilityAppWithFirebaseAuth';
import { useAuthStatus } from '@sudobility/auth-components';
import {
  CurrentEntityProvider,
  EntityClient,
  useCurrentEntity,
} from '@sudobility/entity_client';
import { LazySubscriptionProvider } from '../subscription';
import { useApiSafe } from '../api';

export interface SudobilityAppWithFirebaseAuthAndEntitiesProps extends Omit<
  SudobilityAppWithFirebaseAuthProps,
  'AppProviders' | 'RouterWrapper'
> {
  /**
   * Base URL for the API (optional).
   * Defaults to VITE_API_URL env var.
   * Used for both ApiProvider and EntityClient.
   *
   * @example "https://api.myapp.com"
   */
  apiUrl?: string;

  /**
   * @deprecated Use apiUrl instead. Will be removed in future version.
   */
  entityApiUrl?: string;

  /**
   * RevenueCat API key for production subscriptions (optional).
   * If not provided, reads from VITE_REVENUECAT_API_KEY env var.
   * If neither is available, subscription features are disabled.
   */
  revenueCatApiKey?: string;

  /**
   * RevenueCat API key for sandbox/test subscriptions (optional).
   * Used when testMode is true.
   * If not provided, reads from VITE_REVENUECAT_API_KEY_SANDBOX env var.
   */
  revenueCatApiKeySandbox?: string;

  /**
   * Custom AuthAwareEntityProvider component (optional).
   * Defaults to built-in provider if entityApiUrl is provided.
   */
  AuthAwareEntityProvider?: ComponentType<{ children: ReactNode }>;

  /**
   * Custom EntityAwareSubscriptionProvider component (optional).
   * Defaults to built-in provider that uses LazySubscriptionProvider.
   * Set to false to disable subscription features entirely.
   */
  EntityAwareSubscriptionProvider?:
    ComponentType<{ children: ReactNode }> | false;

  /**
   * Additional providers to wrap around the router content.
   * These are rendered inside EntityAwareSubscriptionProvider but outside BrowserRouter.
   * Use this for app-specific providers like ApiProvider.
   */
  AppProviders?: ComponentType<{ children: ReactNode }>;

  /**
   * Custom router wrapper component (optional).
   * Defaults to BrowserRouter. Pass a fragment wrapper `({ children }) => <>{children}</>`
   * to skip the router entirely (useful when nesting inside an existing router).
   */
  RouterWrapper?: ComponentType<{ children: ReactNode }>;
}

/**
 * Default AuthAwareEntityProvider using CurrentEntityProvider
 */
function DefaultAuthAwareEntityProvider({
  children,
  entityClient,
}: {
  children: ReactNode;
  entityClient: EntityClient;
}) {
  const { user } = useAuthStatus();
  const authUser = useMemo(
    () => (user ? { uid: user.uid, email: user.email } : null),
    [user]
  );

  return (
    <CurrentEntityProvider client={entityClient} user={authUser}>
      {children}
    </CurrentEntityProvider>
  );
}

/**
 * Default EntityAwareSubscriptionProvider using LazySubscriptionProvider
 */
function DefaultEntityAwareSubscriptionProvider({
  children,
  apiKey,
}: {
  children: ReactNode;
  apiKey: string;
}) {
  const { currentEntityId } = useCurrentEntity();
  return (
    <LazySubscriptionProvider
      entityId={currentEntityId ?? undefined}
      apiKey={apiKey}
    >
      {children}
    </LazySubscriptionProvider>
  );
}

/**
 * SudobilityAppWithFirebaseAuthAndEntities - Full-featured app wrapper
 *
 * @example
 * ```tsx
 * // Minimal usage with entityApiUrl - uses all defaults
 * import { SudobilityAppWithFirebaseAuthAndEntities } from '@sudobility/building_blocks';
 * import i18n from './i18n';
 *
 * function App() {
 *   return (
 *     <SudobilityAppWithFirebaseAuthAndEntities
 *       i18n={i18n}
 *       entityApiUrl="https://api.myapp.com/api/v1"
 *     >
 *       <Routes>
 *         <Route path="/" element={<HomePage />} />
 *       </Routes>
 *     </SudobilityAppWithFirebaseAuthAndEntities>
 *   );
 * }
 *
 * // With custom providers
 * function App() {
 *   return (
 *     <SudobilityAppWithFirebaseAuthAndEntities
 *       i18n={i18n}
 *       AuthAwareEntityProvider={MyEntityProvider}
 *       EntityAwareSubscriptionProvider={MySubscriptionProvider}
 *       AppProviders={ApiProvider}
 *     >
 *       <Routes>
 *         <Route path="/" element={<HomePage />} />
 *       </Routes>
 *     </SudobilityAppWithFirebaseAuthAndEntities>
 *   );
 * }
 * ```
 */
export function SudobilityAppWithFirebaseAuthAndEntities({
  apiUrl,
  entityApiUrl, // deprecated, use apiUrl
  revenueCatApiKey,
  revenueCatApiKeySandbox,
  AuthAwareEntityProvider: AuthAwareEntityProviderProp,
  EntityAwareSubscriptionProvider: EntityAwareSubscriptionProviderProp,
  AppProviders,
  RouterWrapper,
  testMode = false,
  ...baseProps
}: SudobilityAppWithFirebaseAuthAndEntitiesProps) {
  // Get API URL from prop or env var
  // Support deprecated entityApiUrl for backwards compatibility
  const baseApiUrl = apiUrl || import.meta.env.VITE_API_URL || '';
  const entityUrl = entityApiUrl || (baseApiUrl ? `${baseApiUrl}/api/v1` : '');

  // Get RevenueCat API key from prop or env var, selecting based on testMode
  const rcApiKeyProd =
    revenueCatApiKey || import.meta.env.VITE_REVENUECAT_API_KEY || '';
  const rcApiKeySandbox =
    revenueCatApiKeySandbox ||
    import.meta.env.VITE_REVENUECAT_API_KEY_SANDBOX ||
    '';
  const rcApiKey = testMode ? rcApiKeySandbox : rcApiKeyProd;

  // Create a combined providers component that includes entity support
  // This renders inside ApiProvider, so useApiSafe() is available
  const EntityProviders: ComponentType<{ children: ReactNode }> = ({
    children,
  }) => {
    const api = useApiSafe();
    const entityClient = useMemo(
      () =>
        entityUrl && api?.networkClient
          ? new EntityClient({
              baseUrl: entityUrl,
              networkClient: api.networkClient,
            })
          : null,
      [api?.networkClient]
    );

    let content = children;

    // Wrap with AppProviders if provided
    if (AppProviders) {
      content = <AppProviders>{content}</AppProviders>;
    }

    // Wrap with EntityAwareSubscriptionProvider (custom, default, or disabled)
    if (EntityAwareSubscriptionProviderProp === false) {
      // Explicitly disabled - skip subscription provider
    } else if (EntityAwareSubscriptionProviderProp) {
      // Custom provider
      content = (
        <EntityAwareSubscriptionProviderProp>
          {content}
        </EntityAwareSubscriptionProviderProp>
      );
    } else if (rcApiKey) {
      // Default provider with API key
      content = (
        <DefaultEntityAwareSubscriptionProvider apiKey={rcApiKey}>
          {content}
        </DefaultEntityAwareSubscriptionProvider>
      );
    }
    // If no API key and no custom provider, subscription features are silently disabled

    // Wrap with AuthAwareEntityProvider (custom or default)
    if (AuthAwareEntityProviderProp) {
      return (
        <AuthAwareEntityProviderProp>{content}</AuthAwareEntityProviderProp>
      );
    }

    // Use default if entityClient is available
    if (entityClient) {
      return (
        <DefaultAuthAwareEntityProvider entityClient={entityClient}>
          {content}
        </DefaultAuthAwareEntityProvider>
      );
    }

    // No entity support if no entityApiUrl or custom provider
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[SudobilityAppWithFirebaseAuthAndEntities] No entityApiUrl or AuthAwareEntityProvider provided. ' +
          'Entity features are disabled. Provide apiUrl or AuthAwareEntityProvider to enable them.'
      );
    }
    return <>{content}</>;
  };

  return (
    <SudobilityAppWithFirebaseAuth
      {...baseProps}
      baseUrl={baseApiUrl}
      testMode={testMode}
      AppProviders={EntityProviders}
      RouterWrapper={RouterWrapper}
    />
  );
}

export default SudobilityAppWithFirebaseAuthAndEntities;
