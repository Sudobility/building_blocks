/**
 * A native-app-style navigation bar: an optional back control on the left, a title (plain text or
 * a composed override), and optional action icons. It renders a framework-agnostic `NavBarSpec`
 * from `@sudobility/navigation`, so the same spec drives this web bar and the React Native header.
 *
 * Icons are referenced by name in the spec and resolved through the `icons` map; an action with no
 * resolvable icon falls back to its text label. For a fully composed title or action row, pass
 * `renderTitle` / `renderActions`.
 */
import { type ComponentType, type ReactNode } from 'react';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import type { NavAction, NavBarSpec } from '@sudobility/navigation';
import { ui } from '@sudobility/design';
import { cn } from '../../utils';

export type NavIconMap = Record<string, ComponentType<{ className?: string }>>;

export interface NavBarProps {
  /** The screen's nav-bar spec. */
  spec: NavBarSpec;
  /** Whether a back control shows when `spec.back.visible` is unset (i.e. the stack can go back). */
  canGoBack?: boolean;
  /** Default back handler. `spec.back.onPress` wins over this when set. */
  onBack?: () => void;
  /** name → icon component. Unresolved names fall back to the action's text label. */
  icons?: NavIconMap;
  /** Composed-title override; wins over `spec.title`/`spec.subtitle`. */
  renderTitle?: (spec: NavBarSpec) => ReactNode;
  /** Composed-actions override; wins over `spec.actions`. */
  renderActions?: (spec: NavBarSpec) => ReactNode;
  className?: string;
}

const iconBtn = cn(
  'inline-flex h-8 w-8 items-center justify-center rounded transition hover:opacity-70',
  'disabled:cursor-not-allowed disabled:opacity-40'
);

function ActionButton({
  action,
  icons,
}: {
  action: NavAction;
  icons?: NavIconMap;
}) {
  const Icon = action.iconName ? icons?.[action.iconName] : undefined;
  return (
    <button
      type='button'
      onClick={action.onPress}
      disabled={action.disabled}
      aria-label={action.label}
      title={action.label}
      className={cn(iconBtn, ui.text.muted)}
    >
      {Icon ? (
        <Icon className='h-5 w-5' />
      ) : (
        <span className='px-1 text-sm'>{action.label}</span>
      )}
    </button>
  );
}

export function NavBar({
  spec,
  canGoBack = false,
  onBack,
  icons,
  renderTitle,
  renderActions,
  className,
}: NavBarProps) {
  if (spec.hidden) return null;

  const showBack = spec.back?.visible ?? canGoBack;
  const handleBack = spec.back?.onPress ?? onBack;

  const actions = (spec.actions ?? []).filter(a => a.show !== false);
  const leftActions = actions.filter(a => a.placement === 'left');
  const rightActions = actions.filter(a => a.placement !== 'left');

  return (
    <div
      className={cn(
        'flex h-12 shrink-0 items-center gap-1 border-b px-2',
        ui.border.default,
        ui.background.surface,
        className
      )}
    >
      {showBack && (
        <button
          type='button'
          onClick={handleBack}
          aria-label={spec.back?.label ?? 'Back'}
          className={cn(
            'inline-flex h-8 items-center gap-0.5 rounded pl-0.5 pr-1.5 transition hover:opacity-70',
            ui.text.muted
          )}
        >
          <ChevronLeftIcon className='h-5 w-5' />
          {spec.back?.label && (
            <span className='text-sm'>{spec.back.label}</span>
          )}
        </button>
      )}

      {leftActions.map(a => (
        <ActionButton key={a.id} action={a} icons={icons} />
      ))}

      <div className='min-w-0 flex-1 px-1'>
        {renderTitle ? (
          renderTitle(spec)
        ) : (
          <div className='min-w-0'>
            {spec.title && (
              <div
                className={cn(
                  'truncate text-base font-semibold',
                  ui.text.strong
                )}
              >
                {spec.title}
              </div>
            )}
            {spec.subtitle && (
              <div className={cn('truncate text-xs', ui.text.muted)}>
                {spec.subtitle}
              </div>
            )}
          </div>
        )}
      </div>

      {renderActions ? (
        <div className='flex shrink-0 items-center gap-1'>
          {renderActions(spec)}
        </div>
      ) : (
        <div className='flex shrink-0 items-center gap-1'>
          {rightActions.map(a => (
            <ActionButton key={a.id} action={a} icons={icons} />
          ))}
        </div>
      )}
    </div>
  );
}
