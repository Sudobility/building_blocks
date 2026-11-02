/**
 * Firebase Auth dependent components
 *
 * These components require @sudobility/components/auth to be installed.
 * Import from '@sudobility/building_blocks/firebase' to use these.
 */

// App wrappers with Firebase auth
export { SudobilityAppWithFirebaseAuth } from './components/app/SudobilityAppWithFirebaseAuth';
export type { SudobilityAppWithFirebaseAuthProps } from './components/app/SudobilityAppWithFirebaseAuth';

// NOTE: SudobilityAppWithFirebaseAuthAndEntities moved to
// @sudobility/entity_pages, and the subscription providers
// (LazySubscriptionProvider, SubscriptionProviderWrapper, SafeSubscriptionContext)
// moved to @sudobility/subscription_pages, so this package keeps no dependency on
// @sudobility/entity_client, @sudobility/subscription_lib or
// @sudobility/subscription_pages. Feature wiring is opt-in per app.

// API context (requires auth status)
export {
  ApiProvider,
  ApiContext,
  useApi,
  useApiSafe,
  type ApiContextValue,
} from './components/api/ApiContext';
