import { useEffect, type ComponentType, type ReactNode } from 'react';
import { Button, Heading, Spinner, Text } from '@sudobility/components';

/** Copy for the signed-out notice shown in the gated page's place. */
export interface RequireSignInNotice {
  /** Optional heading. Omit for apps whose notice is body + button only. */
  title?: string;
  body: string;
  button: string;
}

export interface RequireSignInProps {
  children: ReactNode;
  /** The signed-in user (any truthy value counts as signed in). */
  user: unknown;
  /** Whether auth is still resolving. */
  loading: boolean;
  /**
   * Override the "signed in" test (default: `Boolean(user)`). Pass this for
   * guest-first apps where an anonymous `user` is not "signed in".
   */
  isSignedIn?: boolean;
  /** Open the shared sign-in modal (optionally resuming on success). */
  openSignIn: (onSuccess?: () => void) => void;
  /** Close the shared sign-in modal (called on unmount if provided). */
  closeSignIn?: () => void;
  /** What to show while auth resolves (default: a centered spinner). */
  loadingFallback?: ReactNode;
  /** Copy for the signed-out notice. */
  notice: RequireSignInNotice;
}

/**
 * Gates a page that needs an account **without leaving it**: while auth resolves
 * it shows `loadingFallback`; signed out, the page's place shows a short notice
 * and the shared sign-in modal opens over it; signing in there renders the page
 * itself, at the same URL. Closing the modal without signing in leaves the
 * notice, whose button opens the modal again. No redirect to a login route.
 *
 * Provider-agnostic: pass `user`/`loading`/`openSignIn`/`closeSignIn` from the
 * app's own auth and sign-in contexts (or use {@link createRequireSignIn}).
 */
export function RequireSignIn({
  children,
  user,
  loading,
  isSignedIn,
  openSignIn,
  closeSignIn,
  loadingFallback,
  notice,
}: RequireSignInProps) {
  const signedIn = isSignedIn ?? Boolean(user);

  if (loading) {
    return (
      <>
        {loadingFallback ?? (
          <div className='flex min-h-[40vh] items-center justify-center'>
            <Spinner size='large' />
          </div>
        )}
      </>
    );
  }
  if (signedIn) return <>{children}</>;
  return (
    <SignedOutNotice
      openSignIn={openSignIn}
      closeSignIn={closeSignIn}
      notice={notice}
    />
  );
}

function SignedOutNotice({
  openSignIn,
  closeSignIn,
  notice,
}: {
  openSignIn: (onSuccess?: () => void) => void;
  closeSignIn?: () => void;
  notice: RequireSignInNotice;
}) {
  useEffect(() => {
    openSignIn();
    // Leaving the gated page while the modal is open (Back) takes it along.
    return () => closeSignIn?.();
  }, [openSignIn, closeSignIn]);

  return (
    <main
      className='mx-auto max-w-md px-4 py-16 text-center'
      data-testid='signed-out-notice'
    >
      {notice.title && (
        <Heading level={1} size='2xl' weight='semibold'>
          {notice.title}
        </Heading>
      )}
      <Text as='p' color='muted' className={notice.title ? 'mt-3' : undefined}>
        {notice.body}
      </Text>
      <Button
        type='button'
        variant='primary'
        className='mt-6'
        onClick={() => openSignIn()}
      >
        {notice.button}
      </Button>
    </main>
  );
}

export interface CreateRequireSignInConfig {
  useAuth: () => { user: unknown; loading: boolean };
  useSignIn: () => {
    openSignIn: (onSuccess?: () => void) => void;
    closeSignIn?: () => void;
  };
  /** Hook returning the (reactive, e.g. i18n) notice copy. */
  useText: () => RequireSignInNotice;
  /** Override the "signed in" test, given the current user. */
  isSignedIn?: (user: unknown) => boolean;
  /** Optional custom loading fallback. */
  loadingFallback?: ReactNode;
}

/**
 * Bind {@link RequireSignIn} to an app's auth + sign-in contexts and notice copy,
 * returning a `{ children }` gate component with zero per-use wiring.
 */
export function createRequireSignIn(
  config: CreateRequireSignInConfig
): ComponentType<{ children: ReactNode }> {
  const { useAuth, useSignIn, useText, isSignedIn, loadingFallback } = config;
  return function Gate({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();
    const { openSignIn, closeSignIn } = useSignIn();
    const notice = useText();
    return (
      <RequireSignIn
        user={user}
        loading={loading}
        isSignedIn={isSignedIn ? isSignedIn(user) : undefined}
        openSignIn={openSignIn}
        closeSignIn={closeSignIn}
        loadingFallback={loadingFallback}
        notice={notice}
      >
        {children}
      </RequireSignIn>
    );
  };
}
