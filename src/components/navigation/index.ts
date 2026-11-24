export { NavBar, type NavBarProps, type NavIconMap } from './NavBar';
export { SlidingPanel, type SlidingPanelProps } from './SlidingPanel';
export { SlidePanel, type SlidePanelProps } from './SlidePanel';
export {
  NavProvider,
  useNavStore,
  useNav,
  useNavController,
  type NavController,
} from './NavProvider';

// Re-export the framework-agnostic model types so consumers can get the whole
// navigation vocabulary from building_blocks without a separate import.
export type {
  NavAction,
  NavBack,
  NavBarSpec,
  ScreenEntry,
  ScreenInput,
  NavState,
  NavStore,
} from '@sudobility/navigation';
export { createNavStore } from '@sudobility/navigation';
