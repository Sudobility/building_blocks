/**
 * API Context and Provider
 *
 * Provides network client, auth token, and API configuration to the app.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import { getInfoService } from '@sudobility/di/info';
import { InfoType } from '@sudobility/types';
import type { NetworkClient } from '@sudobility/types';
import {
  getFirebaseAuth,
  FirebaseAuthNetworkService,
} from '@sudobility/auth_lib';

/**
 * API context value provided to consumers
 */
export interface ApiContextValue {
  /** Network client for making API requests */
  networkClient: NetworkClient;
  /** Base URL for API requests */
  baseUrl: string;
  /** Current user ID (Firebase UID) */
  userId: string | null;
  /** Firebase ID token for authenticated requests */
  token: string | null;
  /** Whether API is ready (user authenticated and token available) */
  isReady: boolean;
  /** Whether auth/token is still loading */
  isLoading: boolean;
  /** Force refresh the ID token */
  refreshToken: () => Promise<string | null>;
  /** Whether running in test/sandbox mode */
  testMode: boolean;
}

const ApiContext = createContext<ApiContextValue | null>(null);

/**
 * Hook to access API context
 * @throws Error if used outside of ApiProvider
 */
export function useApi(): ApiContextValue {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}

/**
 * Hook to safely access API context (returns null if not available)
 */
export function useApiSafe(): ApiContextValue | null {
  return useContext(ApiContext);
}

interface ApiProviderProps {
  children: ReactNode;
  /**
   * Base URL for API requests (optional).
   * Defaults to VITE_API_URL env var.
   */
  baseUrl?: string;
  /**
   * Whether running in test/sandbox mode (optional).
   * Defaults to false.
   */
  testMode?: boolean;
}

/**
 * API Provider
 *
 * Manages Firebase ID token and provides API configuration.
 * Uses VITE_API_URL env var for baseUrl by default.
 */
export function ApiProvider({
  children,
  baseUrl: baseUrlProp,
  testMode = false,
}: ApiProviderProps) {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(true);
  const auth = getFirebaseAuth();

  const baseUrl = baseUrlProp || import.meta.env.VITE_API_URL || '';

  // Listen for token changes - Firebase automatically refreshes tokens
  // onIdTokenChanged fires on: sign-in, sign-out, and token refresh
  useEffect(() => {
    if (!auth) {
      setToken(null);
      setUserId(null);
      setTokenLoading(false);
      return;
    }

    setTokenLoading(true);

    const unsubscribe = onIdTokenChanged(auth, async firebaseUser => {
      setUserId(firebaseUser?.uid ?? null);

      if (!firebaseUser) {
        setToken(null);
        setTokenLoading(false);
        return;
      }

      try {
        const idToken = await firebaseUser.getIdToken();
        setToken(idToken);
      } catch {
        try {
          getInfoService().show(
            'Authentication Error',
            'Failed to get ID token',
            InfoType.ERROR,
            5000
          );
        } catch {
          console.error('[ApiProvider] Failed to get ID token');
        }
        setToken(null);
      } finally {
        setTokenLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [auth]);

  // Refresh token function for when token expires
  const refreshToken = useCallback(async (): Promise<string | null> => {
    const currentUser = auth?.currentUser;
    if (!currentUser) return null;
    try {
      const newToken = await currentUser.getIdToken(true); // Force refresh
      setToken(newToken);
      return newToken;
    } catch {
      try {
        getInfoService().show(
          'Authentication Error',
          'Failed to refresh ID token',
          InfoType.ERROR,
          5000
        );
      } catch {
        console.error('[ApiProvider] Failed to refresh ID token');
      }
      setToken(null);
      return null;
    }
  }, [auth]);

  // Create FirebaseAuthNetworkService instance once
  // This handles automatic token refresh on 401 responses
  // Note: FirebaseAuthNetworkService doesn't perfectly implement NetworkClient interface
  // (different request signature), but it's compatible at runtime for our use cases.
  // Using type assertion as a workaround for the interface mismatch between
  // @sudobility/auth_lib and @sudobility/types.
  const networkClientRef = useRef<NetworkClient | null>(null);
  if (!networkClientRef.current) {
    const firebaseNetworkService = new FirebaseAuthNetworkService({
      onTokenRefreshFailed: error => {
        console.error('[ApiProvider] Token refresh failed:', error);
        try {
          getInfoService().show(
            'Authentication Error',
            'Session expired. Please sign in again.',
            InfoType.ERROR,
            5000
          );
        } catch {
          // InfoService not available
        }
      },
    });
    // Type assertion needed due to interface mismatch between FirebaseAuthNetworkService
    // and NetworkClient (auth_lib uses RequestInit/Response while types uses NetworkRequestOptions/NetworkResponse)
    networkClientRef.current =
      firebaseNetworkService as unknown as NetworkClient;
  }

  const value = useMemo<ApiContextValue>(
    () => ({
      networkClient: networkClientRef.current!,
      baseUrl,
      userId,
      token,
      isReady: !!userId && !!token,
      isLoading: tokenLoading,
      refreshToken,
      testMode,
    }),
    [baseUrl, userId, token, tokenLoading, refreshToken, testMode]
  );

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

export { ApiContext };
