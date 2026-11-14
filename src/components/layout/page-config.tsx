/**
 * PageConfig context: pages override the route-level layout
 * (scrollable/maxWidth/padding) via `useSetPageConfig`; `AppShell` merges the
 * overrides into `AppPageLayout`'s `page` prop.
 *
 * Previously copied byte-for-byte into every app (`context/pageConfigContextDef.ts`
 * + `hooks/usePageConfig.ts`); consolidated here so `AppShell` and
 * `MasterDetailPage` share one context.
 */
import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AppPageProps } from './app-page-layout';

export interface PageConfigContextValue {
  pageConfig: Partial<AppPageProps>;
  setPageConfig: (config: Partial<AppPageProps>) => void;
}

export const PageConfigContext = createContext<PageConfigContextValue>({
  pageConfig: {},
  setPageConfig: () => {},
});

/**
 * Standalone provider for the page-config context. `AppShell` provides this
 * context itself, so most apps never need this — it is for an app that keeps a
 * custom shell (e.g. a footer that depends on the current page config) but
 * still wants the shared `useSetPageConfig`/`usePageConfig` instead of a
 * per-app context.
 */
export function PageConfigProvider({ children }: { children: ReactNode }) {
  const [pageConfig, setPageConfig] = useState<Partial<AppPageProps>>({});
  const value = useMemo(() => ({ pageConfig, setPageConfig }), [pageConfig]);
  return (
    <PageConfigContext.Provider value={value}>
      {children}
    </PageConfigContext.Provider>
  );
}

/**
 * Apply a page-level layout override for the lifetime of the calling component.
 * Runs in a layout effect so the config lands before paint; resets on unmount.
 */
export function useSetPageConfig(config: Partial<AppPageProps>) {
  const { setPageConfig } = useContext(PageConfigContext);
  const configKey = JSON.stringify(config);
  useLayoutEffect(() => {
    setPageConfig(config);
    return () => setPageConfig({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey, setPageConfig]);
}

/** The current page-level layout overrides (set by `useSetPageConfig`). */
export function usePageConfig(): Partial<AppPageProps> {
  return useContext(PageConfigContext).pageConfig;
}
