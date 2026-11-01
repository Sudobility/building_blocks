/**
 * Subscription Provider Wrapper
 *
 * Integrates subscription-components with auth and sets up RevenueCat user.
 */

import { type ReactNode, useEffect, useRef } from 'react';
import {
  SubscriptionProvider,
  useSubscriptionContext,
} from '@sudobility/components/subscription';
import { useAuthStatus } from '@sudobility/components/auth';
import { getInfoService } from '@sudobility/di/info';
import { InfoType } from '@sudobility/types';
import {
  setRevenueCatUser,
  clearRevenueCatUser,
  refreshSubscription,
} from '@sudobility/subscription_lib';
import { SafeSubscriptionContext } from './SafeSubscriptionContext';

interface SubscriptionProviderWrapperProps {
  children: ReactNode;
  entityId?: string;
  apiKey: string;
}

const handleSubscriptionError = (error: Error) => {
  try {
    getInfoService().show(
      'Subscription Error',
      error.message,
      InfoType.ERROR,
      5000
    );
  } catch {
    // InfoService not available - log to console
    console.error('[Subscription]', error.message);
  }
};

/**
 * Bridge that provides context and configures RevenueCat user.
 */
function SubscriptionBridge({
  children,
  entityId,
}: {
  children: ReactNode;
  entityId?: string;
}) {
  const { user } = useAuthStatus();
  const context = useSubscriptionContext();
  const entityIdRef = useRef<string | null>(null);

  useEffect(() => {
    const shouldSetUser = user && !user.isAnonymous && entityId;

    if (shouldSetUser && entityId !== entityIdRef.current) {
      entityIdRef.current = entityId;
      // Set user for both subscription-components and subscription_lib
      context.initialize(entityId, user.email || undefined);
      setRevenueCatUser(entityId, user.email || undefined).then(() => {
        // Refresh subscription_lib data after user is set
        refreshSubscription();
      });
    } else if (!shouldSetUser && entityIdRef.current) {
      entityIdRef.current = null;
      clearRevenueCatUser();
    }
  }, [user, entityId, context]);

  return (
    <SafeSubscriptionContext.Provider value={context}>
      {children}
    </SafeSubscriptionContext.Provider>
  );
}

export function SubscriptionProviderWrapper({
  children,
  entityId,
  apiKey,
}: SubscriptionProviderWrapperProps) {
  const { user } = useAuthStatus();

  return (
    <SubscriptionProvider
      apiKey={apiKey}
      userEmail={user?.email || undefined}
      onError={handleSubscriptionError}
    >
      <SubscriptionBridge entityId={entityId}>{children}</SubscriptionBridge>
    </SubscriptionProvider>
  );
}

export default SubscriptionProviderWrapper;
