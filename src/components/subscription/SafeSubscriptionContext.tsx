/**
 * Safe Subscription Context
 *
 * Provides a context that can be safely used even when subscription
 * provider isn't loaded yet. Returns stub values for unauthenticated users.
 */

import { createContext, useContext } from 'react';
import type { SubscriptionContextValue } from '@sudobility/components/subscription';

/**
 * Stub subscription value for unauthenticated users or when
 * subscription provider hasn't loaded yet.
 */
export const STUB_SUBSCRIPTION_VALUE: SubscriptionContextValue = {
  products: [],
  currentSubscription: null,
  isLoading: false,
  error: null,
  initialize: () => Promise.resolve(),
  purchase: () => Promise.resolve(false),
  restore: () => Promise.resolve(false),
  refresh: () => Promise.resolve(),
  clearError: () => {},
};

/**
 * Context that provides subscription state with safe defaults.
 */
export const SafeSubscriptionContext = createContext<SubscriptionContextValue>(
  STUB_SUBSCRIPTION_VALUE
);

/**
 * Hook to safely access subscription context.
 * Returns stub values if provider isn't available.
 */
export function useSafeSubscription(): SubscriptionContextValue {
  return useContext(SafeSubscriptionContext);
}
