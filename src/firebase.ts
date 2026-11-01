/**
 * Firebase Auth dependent components
 *
 * These components require @sudobility/components/auth to be installed.
 * Import from '@sudobility/building_blocks/firebase' to use these.
 */

// App wrappers with Firebase auth
export { SudobilityAppWithFirebaseAuth } from './components/app/SudobilityAppWithFirebaseAuth';
export type { SudobilityAppWithFirebaseAuthProps } from './components/app/SudobilityAppWithFirebaseAuth';

export { SudobilityAppWithFirebaseAuthAndEntities } from './components/app/SudobilityAppWithFirebaseAuthAndEntities';
export type { SudobilityAppWithFirebaseAuthAndEntitiesProps } from './components/app/SudobilityAppWithFirebaseAuthAndEntities';

// API context (requires auth status)
export {
  ApiProvider,
  ApiContext,
  useApi,
  useApiSafe,
  type ApiContextValue,
} from './components/api/ApiContext';

// Subscription providers (require auth status)
export { LazySubscriptionProvider } from './components/subscription/LazySubscriptionProvider';
