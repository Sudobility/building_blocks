/**
 * Breadcrumbs context: a page declares its breadcrumb trail with
 * `useSetBreadcrumbs`, and `AppShell` renders it (so there is one shared,
 * standard breadcrumb mechanism rather than a per-app context). Apps that
 * derive breadcrumbs from the URL instead can keep passing `AppShell`'s
 * `breadcrumbs` prop, which takes precedence over this context.
 */
import { createContext, useContext, useLayoutEffect } from 'react';
import type { BreadcrumbItem } from '../../types';

export interface BreadcrumbsContextValue {
  items: BreadcrumbItem[];
  setItems: (items: BreadcrumbItem[]) => void;
}

export const BreadcrumbsContext = createContext<BreadcrumbsContextValue>({
  items: [],
  setItems: () => {},
});

/**
 * Declare the breadcrumb trail for the active page. Runs in a layout effect so
 * it lands before paint; clears on unmount.
 */
export function useSetBreadcrumbs(items: BreadcrumbItem[]) {
  const { setItems } = useContext(BreadcrumbsContext);
  const key = JSON.stringify(items);
  useLayoutEffect(() => {
    setItems(JSON.parse(key) as BreadcrumbItem[]);
    return () => setItems([]);
  }, [key, setItems]);
}

/** The breadcrumb trail declared by the active page (read by the shell). */
export function useBreadcrumbsItems(): BreadcrumbItem[] {
  return useContext(BreadcrumbsContext).items;
}
