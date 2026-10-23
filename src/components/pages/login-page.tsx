import { useState, type ReactNode } from 'react';
import {
  DEFAULT_LOGIN_VIEW_TEXT,
  LoginView,
  type LoginViewMode,
  type LoginViewText,
} from '@sudobility/components';
import { ui } from '@sudobility/design';
import { cn } from '../../utils';

/**
 * Auth error info passed to onAuthError callback
 */
export interface AuthErrorInfo {
  /** Firebase error code (e.g., 'auth/popup-closed-by-user') */
  code: string;
  /** Error message */
  message: string;
  /** Whether this is a user-initiated action (like closing popup) vs actual error */
  isUserAction: boolean;
}

/**
 * Color variant for the LoginPage.
 * Each variant maps to a set of static, JIT-safe Tailwind classes.
 */
export type LoginPageColorVariant =
  'primary' | 'blue' | 'indigo' | 'violet' | 'orange' | 'emerald' | 'rose';

/**
 * Props for the LoginPage component
 *
 * LoginPage is a presentational component that accepts auth handler callbacks.
 * The consumer must provide the actual auth logic (e.g., Firebase signIn).
 */
export interface LoginPageProps {
  /** Application name displayed as the main title */
  appName: string;
  /** Optional logo element to display above the title */
  logo?: ReactNode;
  /**
   * Handler for email/password sign-in.
   * Called with email and password; should throw on error.
   * The error object should have `code` and `message` properties for proper error display.
   */
  onEmailSignIn: (email: string, password: string) => Promise<void>;
  /**
   * Handler for email/password sign-up (account creation).
   * Called with email and password; should throw on error.
   * Creating an account is offered only when this is given and `showSignUp`
   * is true.
   */
  onEmailSignUp?: (email: string, password: string) => Promise<void>;
  /**
   * Sends a link to reset the password for an address; should throw on error.
   * "Forgot password?" is offered only when this is given.
   */
  onPasswordReset?: (email: string) => Promise<void>;
  /**
   * Handler for Google sign-in.
   * Should perform the Google OAuth flow; should throw on error.
   * Only used when `showGoogleSignIn` is true.
   */
  onGoogleSignIn?: () => Promise<void>;
  /**
   * Handler for Apple sign-in.
   * Should perform the Apple OAuth flow; should throw on error.
   * Only used when `showAppleSignIn` is true.
   */
  onAppleSignIn?: () => Promise<void>;
  /** Callback fired on successful authentication */
  onSuccess: () => void;
  /**
   * Which form the page opens on (default: 'signIn'). A `/register` route
   * passes 'signUp'. A mode the page has no way to do — sign-up without
   * `onEmailSignUp`, reset without `onPasswordReset` — opens on signing in.
   */
  initialMode?: LoginViewMode;
  /** Callback fired on auth errors - if provided, errors won't be shown inline */
  onAuthError?: (error: AuthErrorInfo) => void;
  /** Whether to show Google sign-in option (default: true) */
  showGoogleSignIn?: boolean;
  /** Whether to show Apple sign-in option (default: false) */
  showAppleSignIn?: boolean;
  /** Whether to show sign-up option (default: true) */
  showSignUp?: boolean;
  /** Custom text overrides for localization. Falls back to English defaults for any omitted keys. */
  text?: Partial<LoginPageText>;
  /** Custom className for the container */
  className?: string;
  /**
   * Color variant for themed elements (default: 'primary').
   * Uses static Tailwind classes to ensure JIT compatibility.
   */
  colorVariant?: LoginPageColorVariant;
}

/**
 * Text content for the LoginPage: the page's headings, and every string the
 * form (`LoginView`) shows.
 */
export interface LoginPageText extends LoginViewText {
  /** The heading while creating an account. */
  createAccount: string;
  /** The heading while signing in. */
  signInToAccount: string;
  /** The heading while sending a link to reset a password. */
  resetPassword: string;
}

const defaultText: LoginPageText = {
  ...DEFAULT_LOGIN_VIEW_TEXT,
  createAccount: 'Create your account',
  signInToAccount: 'Sign in to your account',
  resetPassword: 'Reset your password',
};

/**
 * Static Tailwind class mappings for text elements per color variant.
 * Button and input styles come from @sudobility/design system.
 */
const colorVariantClasses: Record<
  LoginPageColorVariant,
  {
    title: string;
    toggleLink: string;
  }
> = {
  primary: {
    title: 'text-primary',
    toggleLink: 'text-primary hover:text-primary/80',
  },
  blue: {
    title: 'text-primary',
    toggleLink: 'text-primary hover:text-primary/80',
  },
  indigo: {
    title: 'text-primary',
    toggleLink: 'text-primary hover:text-primary/80',
  },
  violet: {
    title: 'text-accent-foreground',
    toggleLink: 'text-accent-foreground hover:text-accent-foreground/80',
  },
  orange: {
    title: 'text-warning',
    toggleLink: 'text-warning hover:text-warning/80',
  },
  emerald: {
    title: 'text-success',
    toggleLink: 'text-success hover:text-success/80',
  },
  rose: {
    title: 'text-secondary-foreground',
    toggleLink: 'text-secondary-foreground hover:text-secondary-foreground/80',
  },
};

/**
 * A full-screen sign-in page: the app's name, a heading that says what the
 * form is doing, and the form.
 *
 * **The form is `LoginView` from `@sudobility/components`** — the same view
 * `LoginModal` puts in a dialog — so a page and a modal are one form, and a
 * change to it (password reset was the first) reaches both. What this adds is
 * the page around it: the subtle background, the logo, the title in the
 * page's colour, and a heading that follows the form's mode.
 *
 * This component is fully decoupled from any auth provider. The consumer
 * provides auth handler callbacks (`onEmailSignIn`, `onEmailSignUp`,
 * `onPasswordReset`, `onGoogleSignIn`, `onAppleSignIn`).
 *
 * @example
 * ```tsx
 * import { LoginPage } from '@sudobility/building_blocks';
 * import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
 * import { getFirebaseAuth } from '@sudobility/auth_lib';
 *
 * function MyLoginPage() {
 *   const navigate = useNavigate();
 *   const auth = getFirebaseAuth();
 *
 *   return (
 *     <LoginPage
 *       appName="My App"
 *       onEmailSignIn={async (email, password) => {
 *         await signInWithEmailAndPassword(auth, email, password);
 *       }}
 *       onEmailSignUp={async (email, password) => {
 *         await createUserWithEmailAndPassword(auth, email, password);
 *       }}
 *       onPasswordReset={async email => {
 *         await sendPasswordResetEmail(auth, email);
 *       }}
 *       onGoogleSignIn={async () => {
 *         await signInWithPopup(auth, new GoogleAuthProvider());
 *       }}
 *       onSuccess={() => navigate('/')}
 *     />
 *   );
 * }
 * ```
 */
export function LoginPage({
  appName,
  logo,
  onEmailSignIn,
  onEmailSignUp,
  onPasswordReset,
  onGoogleSignIn,
  onAppleSignIn,
  onSuccess,
  onAuthError,
  initialMode = 'signIn',
  text: textOverrides,
  showGoogleSignIn = true,
  showAppleSignIn = false,
  showSignUp = true,
  className = '',
  colorVariant = 'primary',
}: LoginPageProps) {
  // Development-only warnings for common misconfigurations
  if (process.env.NODE_ENV !== 'production') {
    if (showSignUp && !onEmailSignUp) {
      console.warn(
        '[LoginPage] showSignUp is true but onEmailSignUp handler is not provided. ' +
          'Sign-up will not be offered. Provide onEmailSignUp, or set showSignUp to false.'
      );
    }
    if (showGoogleSignIn && !onGoogleSignIn) {
      console.warn(
        '[LoginPage] showGoogleSignIn is true but onGoogleSignIn handler is not provided. ' +
          'Google sign-in button will not be rendered. Provide onGoogleSignIn or set showGoogleSignIn to false.'
      );
    }
    if (showAppleSignIn && !onAppleSignIn) {
      console.warn(
        '[LoginPage] showAppleSignIn is true but onAppleSignIn handler is not provided. ' +
          'Apple sign-in button will not be rendered. Provide onAppleSignIn or set showAppleSignIn to false.'
      );
    }
  }
  const canSignUp = showSignUp && !!onEmailSignUp;
  const [requestedMode, setMode] = useState<LoginViewMode>(initialMode);
  // The heading has to say what the form is doing, and the form falls back to
  // signing in for a mode it has no way to do.
  const mode: LoginViewMode =
    (requestedMode === 'signUp' && !canSignUp) ||
    (requestedMode === 'resetPassword' && !onPasswordReset)
      ? 'signIn'
      : requestedMode;
  const colors = colorVariantClasses[colorVariant];
  const text = { ...defaultText, ...textOverrides };
  const heading =
    mode === 'signUp'
      ? text.createAccount
      : mode === 'resetPassword'
        ? text.resetPassword
        : text.signInToAccount;

  return (
    <div
      className={cn(
        `min-h-screen flex items-start justify-center ${ui.background.subtle} pt-12 pb-12 px-4 sm:px-6 lg:px-8`,
        className
      )}
    >
      <div className='max-w-md w-full space-y-8'>
        <div>
          {logo && <div className='flex justify-center mb-4'>{logo}</div>}
          <h1 className={cn('text-center text-3xl font-bold', colors.title)}>
            {appName}
          </h1>
          <h2
            className={`mt-6 text-center text-2xl font-semibold ${ui.text.strong}`}
          >
            {heading}
          </h2>
        </div>

        <LoginView
          onEmailSignIn={onEmailSignIn}
          {...(showSignUp && onEmailSignUp ? { onEmailSignUp } : {})}
          {...(onPasswordReset ? { onPasswordReset } : {})}
          {...(showGoogleSignIn && onGoogleSignIn ? { onGoogleSignIn } : {})}
          {...(showAppleSignIn && onAppleSignIn ? { onAppleSignIn } : {})}
          onSuccess={onSuccess}
          {...(onAuthError ? { onAuthError } : {})}
          mode={mode}
          onModeChange={setMode}
          text={text}
          linkClassName={colors.toggleLink}
        />
      </div>
    </div>
  );
}
