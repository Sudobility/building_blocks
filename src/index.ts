// Core components (no auth-components dependency)
export * from './components/topbar';
export * from './components/breadcrumbs';
export * from './components/footer';
export * from './components/layout';
export * from './components/settings';
export * from './components/pages';
export * from './components/empty-state';

// App wrapper without auth dependency
export { SudobilityApp } from './components/app/SudobilityApp';
export type { SudobilityAppProps } from './components/app/SudobilityApp';

// Subscription context/providers moved to @sudobility/subscription_pages
// (and the entity app wrapper to @sudobility/entity_pages) so building_blocks
// keeps no dependency on subscription_lib / subscription_pages / entity_client.

// Constants
export * from './constants';

// Types
export * from './types';

// Utils
export { cn } from './utils';

// i18n
export { initializeI18n, getI18n, i18n, type I18nConfig } from './i18n';
