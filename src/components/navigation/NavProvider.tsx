/**
 * Context plumbing so screens deep in a {@link SlidingPanel} can read and drive the navigation
 * stack without threading the store by hand. Mirrors the `PageConfigContext` pattern: provide the
 * store once, then use `useNav(selector)` to read reactively and `useNavController()` for the
 * push/pop actions.
 */
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useStore } from 'zustand';
import type { NavState, NavStore, ScreenInput } from '@sudobility/navigation';

const NavContext = createContext<NavStore | null>(null);

export function NavProvider({
  store,
  children,
}: {
  store: NavStore;
  children: ReactNode;
}) {
  return <NavContext.Provider value={store}>{children}</NavContext.Provider>;
}

/** The raw store from the nearest {@link NavProvider}. Throws when used outside one. */
export function useNavStore(): NavStore {
  const store = useContext(NavContext);
  if (!store) {
    throw new Error('useNavStore must be used within a <NavProvider>');
  }
  return store;
}

/** Reactively select from the navigation state (re-renders on change). */
export function useNav<T>(selector: (state: NavState) => T): T {
  return useStore(useNavStore(), selector);
}

export interface NavController {
  push: (entry: ScreenInput) => void;
  pop: () => void;
  popToRoot: () => void;
  popTo: (keyOrId: string) => void;
  replace: (entry: ScreenInput) => void;
  reset: (entries: ScreenInput[]) => void;
  setNav: NavState['setNav'];
}

/** Stable push/pop/… actions bound to the nearest store. */
export function useNavController(): NavController {
  const store = useNavStore();
  return useMemo(() => {
    const g = () => store.getState();
    return {
      push: entry => g().push(entry),
      pop: () => g().pop(),
      popToRoot: () => g().popToRoot(),
      popTo: keyOrId => g().popTo(keyOrId),
      replace: entry => g().replace(entry),
      reset: entries => g().reset(entries),
      setNav: (id, nav) => g().setNav(id, nav),
    };
  }, [store]);
}
