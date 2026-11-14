import { type ComponentType, type ReactNode } from 'react';
import { Avatar, Button, Dropdown } from '@sudobility/components';
import type {
  AuthActionProps,
  AuthMenuItem,
} from './app-topbar-with-firebase-auth';

/**
 * The minimal user shape `AuthActionView` reads. Every app's `useAuth()` exposes
 * at least these, so a consolidated component can stay decoupled from any single
 * app's auth provider.
 */
export interface AuthActionUser {
  displayName?: string | null;
  email?: string | null;
}

/** A `Dropdown` item. `separator: true` renders a bare divider line. */
interface DropdownMenuItem {
  id: string;
  label: string;
  onClick: () => void;
  separator?: boolean;
}

const divider = (id: string): DropdownMenuItem => ({
  id,
  label: '',
  onClick: () => {},
  separator: true,
});

/** The topbar passes a pixel avatar size; our `Avatar` takes a size token. */
function avatarSizeToken(px: number): 'sm' | 'md' | 'lg' {
  if (px <= 28) return 'sm';
  if (px >= 44) return 'lg';
  return 'md';
}

export interface AuthActionViewProps extends AuthActionProps {
  /** The signed-in user, or null when signed out. */
  user: AuthActionUser | null;
  /** Called when the user picks "sign out". */
  onSignOut: () => void;
  /** Label for the appended sign-out menu entry. */
  signOutLabel: string;
  /** Fallback display name when the user has neither displayName nor email. */
  accountLabel?: string;
  /** Override how the avatar is rendered (e.g. an uploaded photo). */
  renderAvatar?: (user: AuthActionUser) => ReactNode;
}

/**
 * AuthActionView — the presentational auth action for the app top bar, with no
 * dependency on any auth provider: a "Log in" button when signed out, else the
 * top-right avatar + dropdown.
 *
 * The dropdown is config-driven: the topbar passes its `authenticatedMenuItems`
 * down as `menuItems`; this view maps them and appends sign-out. Fed to the
 * topbar's `AuthActionComponent` slot — bind it to an app's `useAuth` with
 * {@link createAuthAction}, or render it directly.
 */
export function AuthActionView({
  user,
  onSignOut,
  signOutLabel,
  accountLabel = 'Account',
  renderAvatar,
  onLoginClick,
  menuItems = [],
  avatarSize = 32,
  dropdownAlign = 'right',
  loginButtonText,
  loginButtonClassName,
}: AuthActionViewProps) {
  if (!user) {
    return (
      <Button
        type='button'
        variant='primary'
        onClick={() => onLoginClick?.()}
        className={loginButtonClassName}
        data-testid='log-in-button'
      >
        {loginButtonText ?? 'Log in'}
      </Button>
    );
  }

  const name = user.displayName ?? user.email ?? accountLabel;

  const items: DropdownMenuItem[] = [];
  for (const m of menuItems) {
    items.push({ id: m.id, label: m.label, onClick: m.onClick ?? (() => {}) });
    if (m.dividerAfter) items.push(divider(`${m.id}-divider`));
  }
  if (items.length > 0 && !items[items.length - 1].separator) {
    items.push(divider('sign-out-divider'));
  }
  items.push({
    id: 'sign-out',
    label: signOutLabel,
    onClick: () => onSignOut(),
  });

  return (
    <Dropdown
      align={dropdownAlign}
      trigger={
        <span data-testid='account-menu'>
          {renderAvatar ? (
            renderAvatar(user)
          ) : (
            <Avatar name={name} size={avatarSizeToken(avatarSize)} />
          )}
        </span>
      }
      items={items}
    />
  );
}

export interface CreateAuthActionConfig {
  /** The app's auth hook — must return the signed-in user and a sign-out action. */
  useAuth: () => {
    user: AuthActionUser | null;
    signOut: () => void | Promise<void>;
  };
  /**
   * Optional hook returning the (reactive, e.g. i18n) labels. Called inside the
   * component so translations update with the language.
   */
  useLabels?: () => { signOut: string; account?: string };
  /** Override how the avatar is rendered. */
  renderAvatar?: (user: AuthActionUser) => ReactNode;
}

/**
 * Bind {@link AuthActionView} to an app's `useAuth` (and optional label hook),
 * returning the `ComponentType<AuthActionProps>` the top bar expects as its
 * `AuthActionComponent`. This removes the per-app adapter boilerplate while
 * keeping the app's provider out of this library.
 *
 * @example
 * ```tsx
 * const AuthActionComponent = createAuthAction({
 *   useAuth,
 *   useLabels: () => { const { t } = useTranslation('common');
 *     return { signOut: t('nav.signOut'), account: t('nav.account') }; },
 * });
 * ```
 */
export function createAuthAction(
  config: CreateAuthActionConfig
): ComponentType<AuthActionProps> {
  const { useAuth, useLabels, renderAvatar } = config;
  return function AuthAction(props: AuthActionProps) {
    const { user, signOut } = useAuth();
    const labels = useLabels?.() ?? { signOut: 'Sign out', account: 'Account' };
    return (
      <AuthActionView
        {...props}
        user={user}
        onSignOut={() => void signOut()}
        signOutLabel={labels.signOut}
        accountLabel={labels.account}
        renderAvatar={renderAvatar}
      />
    );
  };
}

export type { AuthMenuItem };
