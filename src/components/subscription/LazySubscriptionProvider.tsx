/**
 * Lazy Subscription Provider
 *
 * Defers loading of RevenueCat SDK (~600KB) until user is authenticated.
 * For unauthenticated users, provides a stub context.
 */

import { type ReactNode, Suspense, lazy, useMemo } from 'react';
import { useAuthStatus } from '@sudobility/components/auth';
import {
  SafeSubscriptionContext,
  STUB_SUBSCRIPTION_VALUE,
} from './SafeSubscriptionContext';

// Lazy load the actual subscription provider
const SubscriptionProviderWrapper = lazy(
  () => import('./SubscriptionProviderWrapper')
);

function StubSubscriptionProvider({ children }: { children: ReactNode }) {
  return (
    <SafeSubscriptionContext.Provider value={STUB_SUBSCRIPTION_VALUE}>
      {children}
    </SafeSubscriptionContext.Provider>
  );
}

interface LazySubscriptionProviderProps {
  children: ReactNode;
  /** Entity ID to use as RevenueCat subscriber */
  entityId?: string;
  /** RevenueCat API key */
  apiKey: string;
}

/**
 * Lazy wrapper for SubscriptionProvider that only loads RevenueCat SDK
 * when the user is authenticated. This saves ~600KB on initial load.
 * For unauthenticated users, provides a stub context so hooks don't throw.
 */
export function LazySubscriptionProvider({
  children,
  entityId,
  apiKey,
}: LazySubscriptionProviderProps) {
  const { user } = useAuthStatus();

  const isAuthenticated = useMemo(() => {
    return !!user && !user.isAnonymous;
  }, [user]);

  if (!isAuthenticated) {
    return <StubSubscriptionProvider>{children}</StubSubscriptionProvider>;
  }

  return (
    <Suspense
      fallback={<StubSubscriptionProvider>{children}</StubSubscriptionProvider>}
    >
      <SubscriptionProviderWrapper entityId={entityId} apiKey={apiKey}>
        {children}
      </SubscriptionProviderWrapper>
    </Suspense>
  );
}

export default LazySubscriptionProvider;
