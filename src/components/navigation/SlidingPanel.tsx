/**
 * `SlidingPanel` renders a `@sudobility/navigation` stack as native-app-style screens: the top
 * screen fills the panel under a {@link NavBar}, and push/pop animate with a horizontal slide
 * (new screen in from the right; popped screen out to the right, revealing the one beneath).
 * Honours `prefers-reduced-motion` by cutting instantly. This is the web/extension counterpart of
 * React Native's native stack — on RN, React Navigation owns the stack instead.
 *
 * Drop-in usage: give it the `store` and a `screens` map (screen `key` → body renderer). Each
 * screen's bar comes from its entry's `nav` spec; override per-screen with `renderTitle` /
 * `renderActions`, or replace the whole bar with `renderNavBar`.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useStore } from 'zustand';
import type { NavStore, ScreenEntry } from '@sudobility/navigation';
import { ui } from '@sudobility/design';
import { cn } from '../../utils';
import { NavBar, type NavIconMap } from './NavBar';

export interface SlidingPanelProps {
  /** The navigation stack store (from `createNavStore`). */
  store: NavStore;
  /** Screen `key` → body renderer. A key with no renderer shows nothing. */
  screens: Record<string, (entry: ScreenEntry) => ReactNode>;
  /** name → icon component, forwarded to each screen's `NavBar`. */
  icons?: NavIconMap;
  /** Replace the whole nav bar for every screen. */
  renderNavBar?: (args: {
    entry: ScreenEntry;
    canGoBack: boolean;
    onBack: () => void;
  }) => ReactNode;
  /** Per-screen composed title override. */
  renderTitle?: (entry: ScreenEntry) => ReactNode;
  /** Per-screen composed actions override. */
  renderActions?: (entry: ScreenEntry) => ReactNode;
  /** Slide duration in ms (also the CSS transition). Default 300. */
  slideMs?: number;
  /**
   * Called after a pop animation completes, with the screen that left. Use it to defer a side
   * effect until the screen has slid away (e.g. sign-out after a logout pop).
   */
  onPopComplete?: (popped: ScreenEntry) => void;
  className?: string;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  );
}

/**
 * A single in-flight slide. `push` = the new top (`id`) enters from the right; `pop` = the removed
 * top (`entry`, no longer in the stack) exits to the right, revealing the one beneath. Only one
 * runs at a time; a new navigation replaces it.
 */
type Transition =
  { kind: 'push'; id: string } | { kind: 'pop'; entry: ScreenEntry } | null;

export function SlidingPanel({
  store,
  screens,
  icons,
  renderNavBar,
  renderTitle,
  renderActions,
  slideMs = 300,
  onPopComplete,
  className,
}: SlidingPanelProps) {
  const stack = useStore(store, s => s.stack);

  // onPopComplete via ref so the animation effects don't churn when the callback identity changes.
  const popCb = useRef(onPopComplete);
  popCb.current = onPopComplete;

  const prevStackRef = useRef<ScreenEntry[]>(stack);
  const [tx, setTx] = useState<Transition>(null);
  // false = the moving layer sits at its start position; true = animate it to its end.
  const [run, setRun] = useState(false);

  // Detect a navigation and start a slide. Only `push`/`pop` slide — `replace`/`reset` are
  // programmatic swaps and change instantly. Reduced motion cuts to the end at once.
  useEffect(() => {
    const prevStack = prevStackRef.current;
    prevStackRef.current = stack;
    const prevTop = prevStack[prevStack.length - 1];
    const nextTop = stack[stack.length - 1];
    if (!prevTop || !nextTop || prevTop.id === nextTop.id) return;

    const op = store.getState().lastOp;
    if (op !== 'push' && op !== 'pop') {
      setTx(null);
      return;
    }
    if (prefersReducedMotion()) {
      if (op === 'pop') popCb.current?.(prevTop);
      setTx(null);
      return;
    }
    setTx(
      op === 'push'
        ? { kind: 'push', id: nextTop.id }
        : { kind: 'pop', entry: prevTop }
    );
    setRun(false);
  }, [stack, store]);

  // Kick the transition on the next frame so the browser paints the start position first.
  useEffect(() => {
    if (!tx || run) return;
    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => setRun(true));
    });
    return () => {
      window.cancelAnimationFrame(raf1);
      if (raf2) window.cancelAnimationFrame(raf2);
    };
  }, [tx, run]);

  // End the transition after the duration; a pop fires onPopComplete and drops its leaving layer.
  useEffect(() => {
    if (!tx || !run) return;
    const t = window.setTimeout(() => {
      if (tx.kind === 'pop') popCb.current?.(tx.entry);
      setTx(null);
    }, slideMs);
    return () => window.clearTimeout(t);
  }, [tx, run, slideMs]);

  const onBackFor = () => store.getState().pop();
  const canGoBackFor = (entry: ScreenEntry) =>
    store.getState().stack.findIndex(e => e.id === entry.id) > 0;

  const renderScreen = (entry: ScreenEntry) => {
    const spec = entry.nav ?? {};
    const body = screens[entry.key];
    return (
      <div
        className={cn(
          'flex h-full w-full flex-col overflow-hidden',
          ui.background.surface
        )}
      >
        {renderNavBar ? (
          renderNavBar({
            entry,
            canGoBack: canGoBackFor(entry),
            onBack: onBackFor,
          })
        ) : (
          <NavBar
            spec={spec}
            canGoBack={canGoBackFor(entry)}
            onBack={onBackFor}
            icons={icons}
            renderTitle={renderTitle ? () => renderTitle(entry) : undefined}
            renderActions={
              renderActions ? () => renderActions(entry) : undefined
            }
          />
        )}
        <div className='min-h-0 flex-1 overflow-auto'>
          {body ? body(entry) : null}
        </div>
      </div>
    );
  };

  const base = cn(
    'relative h-full w-full overflow-hidden',
    ui.background.surface,
    className
  );

  // Every stack entry renders as its own absolutely-positioned layer, keyed stably by `id`, so
  // screens below the top STAY MOUNTED (their state and any running work survive navigation — a
  // native stack keeps lower screens alive). During a pop the removed top is appended as a
  // still-mounted "leaving" layer until its slide finishes.
  const layers: { entry: ScreenEntry; z: number; moving: boolean }[] =
    stack.map((entry, i) => ({
      entry,
      z: i + 1,
      moving: tx?.kind === 'push' && tx.id === entry.id,
    }));
  if (tx?.kind === 'pop') {
    layers.push({ entry: tx.entry, z: stack.length + 1, moving: true });
  }

  const transformFor = (moving: boolean): string | undefined => {
    if (!tx || !moving) return undefined; // at rest
    if (tx.kind === 'push') return run ? 'translateX(0)' : 'translateX(100%)';
    return run ? 'translateX(100%)' : 'translateX(0)'; // pop
  };

  return (
    <div className={base}>
      {layers.map(layer => (
        <div
          key={layer.entry.id}
          className='absolute inset-0'
          style={{
            zIndex: layer.z,
            transform: transformFor(layer.moving),
            // Transition only the moving layer, and only once it has been placed at its start —
            // otherwise the initial placement itself would animate.
            transition:
              tx && layer.moving && run
                ? `transform ${slideMs}ms ease-out`
                : undefined,
          }}
        >
          {renderScreen(layer.entry)}
        </div>
      ))}
    </div>
  );
}
