/**
 * SudobilityAppWithFirebaseAuth - App wrapper with Firebase authentication
 *
 * Extends SudobilityApp with:
 * - Firebase AuthProviderWrapper for authentication (built-in default)
 * - ApiProvider for network/token management (built-in default)
 * - Query cache reset when the signed-in user changes
 */
import { ComponentType, ReactNode } from 'react';
import { SudobilityApp, SudobilityAppProps } from './SudobilityApp';
import { AuthQueryCacheReset } from './AuthQueryCacheReset';
import { AuthProvider } from '@sudobility/components/auth';
import {
  getFirebaseAuth,
  getFirebaseErrorMessage,
  initializeFirebaseAuth,
} from '@sudobility/auth_lib';
import { ApiProvider } from '../api';

/** Auth text labels for UI - all fields required for localization */
export interface AuthTexts {
  signInTitle: string;
  signInWithEmail: string;
  createAccount: string;
  resetPassword: string;
  signIn: string;
  signUp: string;
  logout: string;
  login: string;
  continueWithGoogle: string;
  continueWithApple: string;
  continueWithEmail: string;
  sendResetLink: string;
  backToSignIn: string;
  close: string;
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  emailPlaceholder: string;
  passwordPlaceholder: string;
  confirmPasswordPlaceholder: string;
  displayNamePlaceholder: string;
  forgotPassword: string;
  noAccount: string;
  haveAccount: string;
  or: string;
  resetEmailSent: string;
  resetEmailSentDesc: string;
  passwordMismatch: string;
  passwordTooShort: string;
  loading: string;
}

/** Auth error messages for Firebase error codes */
export interface AuthErrorTexts {
  'auth/user-not-found': string;
  'auth/wrong-password': string;
  'auth/invalid-email': string;
  'auth/invalid-credential': string;
  'auth/email-already-in-use': string;
  'auth/weak-password': string;
  'auth/too-many-requests': string;
  'auth/network-request-failed': string;
  'auth/popup-closed-by-user': string;
  'auth/popup-blocked': string;
  'auth/account-exists-with-different-credential': string;
  'auth/operation-not-allowed': string;
  default: string;
}

export interface SudobilityAppWithFirebaseAuthProps extends Omit<
  SudobilityAppProps,
  'AppProviders' | 'RouterWrapper'
> {
  /**
   * Custom Firebase auth provider wrapper component (optional).
   * If provided, authTexts and authErrorTexts are ignored.
   */
  AuthProviderWrapper?: ComponentType<{ children: ReactNode }>;

  /**
   * Localized auth UI texts (required if not using custom AuthProviderWrapper).
   */
  authTexts?: AuthTexts;

  /**
   * Localized auth error messages (required if not using custom AuthProviderWrapper).
   */
  authErrorTexts?: AuthErrorTexts;

  /**
   * Auth providers to enable (optional).
   * Defaults to ["google", "email"].
   */
  authProviders?: ('google' | 'email' | 'apple')[];

  /**
   * Whether to enable anonymous auth (optional).
   * Defaults to false.
   */
  enableAnonymousAuth?: boolean;

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
 * Default AuthProviderWrapper using Firebase
 */
function DefaultAuthProviderWrapper({
  children,
  providers,
  enableAnonymous,
  texts,
  errorTexts,
}: {
  children: ReactNode;
  providers: ('google' | 'email' | 'apple')[];
  enableAnonymous: boolean;
  texts: AuthTexts;
  errorTexts: AuthErrorTexts;
}) {
  // Initialize Firebase Auth (idempotent - safe to call multiple times)
  initializeFirebaseAuth();

  const auth = getFirebaseAuth();

  // If Firebase is not configured, render children without auth
  if (!auth) {
    console.warn(
      '[SudobilityAppWithFirebaseAuth] No auth instance - Firebase not configured'
    );
    return <>{children}</>;
  }

  return (
    <AuthProvider
      firebaseConfig={{ type: 'instance', auth: auth }}
      providerConfig={{
        providers,
        enableAnonymous,
      }}
      texts={texts}
      errorTexts={errorTexts}
      resolveErrorMessage={getFirebaseErrorMessage}
    >
      {children}
    </AuthProvider>
  );
}

/**
 * SudobilityAppWithFirebaseAuth - App wrapper with Firebase authentication
 *
 * @example
 * ```tsx
 * // With custom AuthProviderWrapper (recommended for i18n)
 * import { SudobilityAppWithFirebaseAuth } from '@sudobility/building_blocks';
 *
 * function App() {
 *   return (
 *     <SudobilityAppWithFirebaseAuth
 *       AuthProviderWrapper={MyAuthProviderWrapper}
 *     >
 *       <Routes>
 *         <Route path="/" element={<HomePage />} />
 *       </Routes>
 *     </SudobilityAppWithFirebaseAuth>
 *   );
 * }
 *
 * // With localized texts
 * function App() {
 *   return (
 *     <SudobilityAppWithFirebaseAuth
 *       authTexts={localizedAuthTexts}
 *       authErrorTexts={localizedAuthErrorTexts}
 *     >
 *       <Routes>
 *         <Route path="/" element={<HomePage />} />
 *       </Routes>
 *     </SudobilityAppWithFirebaseAuth>
 *   );
 * }
 * ```
 */
export function SudobilityAppWithFirebaseAuth({
  AuthProviderWrapper: AuthProviderWrapperProp,
  authTexts,
  authErrorTexts,
  authProviders = ['google', 'email'],
  enableAnonymousAuth = false,
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

    // Wrap with AuthProviderWrapper (custom or default)
    if (AuthProviderWrapperProp) {
      return <AuthProviderWrapperProp>{content}</AuthProviderWrapperProp>;
    }

    // Require texts when using default AuthProviderWrapper
    if (!authTexts || !authErrorTexts) {
      throw new Error(
        '[SudobilityAppWithFirebaseAuth] authTexts and authErrorTexts are required when not using a custom AuthProviderWrapper'
      );
    }

    return (
      <DefaultAuthProviderWrapper
        providers={authProviders}
        enableAnonymous={enableAnonymousAuth}
        texts={authTexts}
        errorTexts={authErrorTexts}
      >
        {content}
      </DefaultAuthProviderWrapper>
    );
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
