/**
 * A page that is a master list and a detail, each scrolling on its own.
 *
 * `@sudobility/components`' `MasterDetailLayout` scrolls only when what holds it
 * has a height; this gives it one (`flex-1 min-h-0` inside the shell's flex
 * column) and sets the page config that goes with it (via `useSetPageConfig`),
 * so the panels scroll rather than the page.
 *
 * Previously duplicated per app; consolidated here so it shares the one
 * `PageConfigContext` with `AppShell`.
 */
import { MasterDetailLayout } from '@sudobility/components';
import type { MasterDetailLayoutProps } from '@sudobility/components';
import { useSetPageConfig } from './page-config';

const PANEL_CLASS = 'min-h-0 overflow-y-auto overscroll-contain';

export type MasterDetailPageProps = Omit<
  MasterDetailLayoutProps,
  'masterClassName' | 'detailClassName'
>;

export function MasterDetailPage(props: MasterDetailPageProps) {
  // The panels scroll, not the page: that is what keeps the list in place.
  useSetPageConfig({
    layoutMode: 'full',
    maxWidth: 'full',
    contentPadding: 'none',
    scrollable: false,
  });
  return (
    <div className='flex h-full min-h-0 w-full min-w-0 flex-1 flex-col'>
      <MasterDetailLayout
        masterWidth={280}
        detailMaxWidth={1024}
        detailPadding
        {...props}
        masterClassName={PANEL_CLASS}
        detailClassName={PANEL_CLASS}
      />
    </div>
  );
}

export default MasterDetailPage;
