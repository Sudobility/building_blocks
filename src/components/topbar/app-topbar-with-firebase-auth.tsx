import React, { type ReactNode, type ComponentType } from 'react';
import { AppTopBar, type AppTopBarProps } from './app-topbar';

/**
 * Auth menu item for the authenticated user dropdown.
 * This matches the AuthMenuItem interface from @sudobility/components/auth.
 */
export interface AuthMenuItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Icon element (typically a small SVG) */
  icon?: ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Show divider after this item */
  dividerAfter?: boolean;
}

/**
 * Props for the AuthAction component from @sudobility/components/auth.
 */
export interface AuthActionProps {
  /** Avatar size in pixels */
  avatarSize?: number;
  /** Dropdown alignment */
  dropdownAlign?: 'left' | 'right';
  /** Login button click handler */
  onLoginClick?: () => void;
  /** Menu items for authenticated user dropdown */
  menuItems?: AuthMenuItem[];
  /** Custom login button text */
  loginButtonText?: string;
  /** Custom className for login button */
  loginButtonClassName?: string;
}

export interface AppTopBarWithFirebaseAuthProps extends Omit<
  AppTopBarProps,
  'renderAccountSection'
> {
  /**
   * AuthAction component from @sudobility/components/auth.
   * This is passed as a prop to avoid hard dependency on auth-components.
   */
  AuthActionComponent: ComponentType<AuthActionProps>;

  /** Additional menu items for authenticated users */
  authenticatedMenuItems?: AuthMenuItem[];

  /** Login button click handler */
  onLoginClick?: () => void;

  /** Avatar size in pixels */
  avatarSize?: number;

  /** Dropdown alignment */
  dropdownAlign?: 'left' | 'right';

  /** Custom login button text */
  loginButtonText?: string;

  /** Custom login button className */
  loginButtonClassName?: string;
}

/**
 * AppTopBarWithFirebaseAuth - TopBar with Firebase authentication integration.
 *
 * This component wraps AppTopBar and provides the AuthAction component
 * from @sudobility/components/auth for the account section.
 *
 * Note: The AuthAction component must be passed as a prop to avoid
 * hard dependency on @sudobility/components/auth.
 *
 * @example
 * ```tsx
 * import { AuthAction } from '@sudobility/components/auth';
 *
 * <AppTopBarWithFirebaseAuth
 *   logo={{ src: '/logo.png', appName: 'My App' }}
 *   menuItems={[...]}
 *   AuthActionComponent={AuthAction}
 *   onLoginClick={() => navigate('/login')}
 *   authenticatedMenuItems={[
 *     { id: 'dashboard', label: 'Dashboard', onClick: () => navigate('/dashboard') },
 *   ]}
 * />
 * ```
 */
export const AppTopBarWithFirebaseAuth: React.FC<
  AppTopBarWithFirebaseAuthProps
> = ({
  AuthActionComponent,
  authenticatedMenuItems = [],
  onLoginClick,
  avatarSize = 32,
  dropdownAlign = 'right',
  loginButtonText,
  loginButtonClassName,
  ...topBarProps
}) => {
  const renderAccountSection = () => (
    <AuthActionComponent
      avatarSize={avatarSize}
      dropdownAlign={dropdownAlign}
      onLoginClick={onLoginClick}
      menuItems={authenticatedMenuItems}
      loginButtonText={loginButtonText}
      loginButtonClassName={loginButtonClassName}
    />
  );

  return (
    <AppTopBar {...topBarProps} renderAccountSection={renderAccountSection} />
  );
};

export default AppTopBarWithFirebaseAuth;
