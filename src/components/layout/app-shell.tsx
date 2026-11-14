import { type ReactNode, useMemo, useState } from 'react';
import {
  AppPageLayout,
  type AppPageProps,
  type TopBarConfig,
  type FooterConfig,
} from './app-page-layout';
import type { AppBreadcrumbsProps } from '../breadcrumbs/app-breadcrumbs';
import { PageConfigContext } from './page-config';
import {
  BreadcrumbsContext,
  type BreadcrumbsContextValue,
} from './breadcrumbs-context';
import type { BreadcrumbItem } from '../../types';

export interface AppShellProps {
  /** Page content (usually a routed `<Outlet/>`). */
  children: ReactNode;
  /** TopBar configuration, passed straight through to `AppPageLayout`. */
  topBar: TopBarConfig;
  /** Footer configuration (optional). */
  footer?: FooterConfig;
  /**
   * Breadcrumbs configuration (optional). Apps that derive breadcrumbs from the
   * URL pass this directly; it takes precedence over page-declared breadcrumbs.
   * Apps whose pages declare their trail via `useSetBreadcrumbs` leave this unset
   * and pass `breadcrumbLinkComponent` instead.
   */
  breadcrumbs?: AppBreadcrumbsProps;
  /**
   * Link component used to render page-declared breadcrumbs (from
   * `useSetBreadcrumbs`). Ignored when `breadcrumbs` is passed explicitly.
   */
  breadcrumbLinkComponent?: AppBreadcrumbsProps['LinkComponent'];
  /**
   * Route-level page defaults. A page overrides these at runtime via
   * `useSetPageConfig`; the override is merged in last.
   */
  pageDefaults?: AppPageProps;
}

/**
 * AppShell — the one site-wide shell. Composes `AppPageLayout` (top bar,
 * breadcrumbs, content, footer) and owns both the `PageConfigContext` and the
 * `BreadcrumbsContext`, so a page deep in the tree can override the route-level
 * layout (`useSetPageConfig`) or declare its breadcrumb trail
 * (`useSetBreadcrumbs`) without the shell knowing about it — one shared shell
 * instead of a per-app `ScreenContainer` + page-config + breadcrumb context.
 *
 * @example
 * ```tsx
 * // URL-derived breadcrumbs: pass them in.
 * <AppShell topBar={topBar} footer={footer} breadcrumbs={breadcrumbs}
 *   pageDefaults={{ layoutMode: 'full', maxWidth: '5xl' }}>
 *   <Outlet />
 * </AppShell>
 *
 * // Page-declared breadcrumbs: pages call useSetBreadcrumbs(); the shell renders them.
 * <AppShell topBar={topBar} footer={footer} breadcrumbLinkComponent={LinkWrapper}>
 *   <Outlet />
 * </AppShell>
 * ```
 */
export function AppShell({
  children,
  topBar,
  footer,
  breadcrumbs,
  breadcrumbLinkComponent,
  pageDefaults,
}: AppShellProps) {
  const [pageConfig, setPageConfig] = useState<Partial<AppPageProps>>({});
  const pageConfigCtx = useMemo(
    () => ({ pageConfig, setPageConfig }),
    [pageConfig]
  );

  const [crumbs, setCrumbs] = useState<BreadcrumbItem[]>([]);
  const breadcrumbsCtx = useMemo<BreadcrumbsContextValue>(
    () => ({ items: crumbs, setItems: setCrumbs }),
    [crumbs]
  );

  // An explicit `breadcrumbs` prop (URL-derived) wins; otherwise render the
  // trail a page declared via `useSetBreadcrumbs`.
  const resolvedBreadcrumbs: AppBreadcrumbsProps | undefined =
    breadcrumbs ??
    (crumbs.length > 0
      ? { items: crumbs, LinkComponent: breadcrumbLinkComponent }
      : undefined);

  return (
    <PageConfigContext.Provider value={pageConfigCtx}>
      <BreadcrumbsContext.Provider value={breadcrumbsCtx}>
        <AppPageLayout
          topBar={topBar}
          breadcrumbs={resolvedBreadcrumbs}
          footer={footer}
          page={{ ...pageDefaults, ...pageConfig }}
        >
          {children}
        </AppPageLayout>
      </BreadcrumbsContext.Provider>
    </PageConfigContext.Provider>
  );
}

export default AppShell;
