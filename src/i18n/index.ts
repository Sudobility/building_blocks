/**
 * Default i18n configuration for Sudobility apps
 *
 * Creates a pre-configured i18next instance with:
 * - HTTP backend for loading translations from /locales/
 * - Language detection from URL path, localStorage, navigator
 * - React integration
 */

import i18n, { type InitOptions } from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// Default supported languages
const DEFAULT_SUPPORTED_LANGUAGES = ['en'];

// Default namespaces
const DEFAULT_NAMESPACES = [
  'common',
  'home',
  'pricing',
  'docs',
  'dashboard',
  'auth',
  'privacy',
  'terms',
  'settings',
];

/**
 * Detect language from URL path first, then localStorage
 */
function detectLanguageFromPath(supportedLanguages: string[]): string {
  if (typeof window === 'undefined') {
    return 'en';
  }

  // Check URL path first
  const pathLang = window.location.pathname.split('/')[1];
  if (pathLang && supportedLanguages.includes(pathLang)) {
    return pathLang;
  }

  // Fall back to localStorage
  try {
    const stored = localStorage.getItem('language');
    if (stored && supportedLanguages.includes(stored)) {
      return stored;
    }
  } catch {
    // localStorage may throw in Safari private browsing
  }

  return 'en';
}

export interface I18nConfig {
  /**
   * Supported language codes.
   * Defaults to ["en"].
   */
  supportedLanguages?: string[];

  /**
   * Translation namespaces to load.
   * Defaults to common app namespaces.
   */
  namespaces?: string[];

  /**
   * Default namespace.
   * Defaults to "common".
   */
  defaultNamespace?: string;

  /**
   * Path pattern for loading translations.
   * Defaults to "/locales/{{lng}}/{{ns}}.json".
   */
  loadPath?: string;

  /**
   * Enable debug logging.
   * Defaults to false.
   */
  debug?: boolean;
}

let initialized = false;

/**
 * Initialize the default i18n instance.
 * Safe to call multiple times - only initializes once.
 */
export function initializeI18n(config: I18nConfig = {}): typeof i18n {
  if (initialized) {
    return i18n;
  }
  initialized = true;

  const {
    supportedLanguages = DEFAULT_SUPPORTED_LANGUAGES,
    namespaces = DEFAULT_NAMESPACES,
    defaultNamespace = 'common',
    loadPath = '/locales/{{lng}}/{{ns}}.json',
    debug = false,
  } = config;

  i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      lng: detectLanguageFromPath(supportedLanguages),
      fallbackLng: {
        zh: ['zh', 'en'],
        'zh-hant': ['zh-hant', 'zh', 'en'],
        default: ['en'],
      },
      initImmediate: false,
      supportedLngs: supportedLanguages,
      debug,
      nonExplicitSupportedLngs: true,

      interpolation: {
        escapeValue: false,
      },

      backend: {
        loadPath,
      },

      detection: {
        order: ['path', 'localStorage', 'navigator'],
        caches: ['localStorage'],
        lookupLocalStorage: 'language',
        lookupFromPathIndex: 0,
      },

      load: 'languageOnly',
      preload: [],
      cleanCode: false,
      lowerCaseLng: false,

      defaultNS: defaultNamespace,
      ns: namespaces,
    } as InitOptions);

  return i18n;
}

/**
 * Get the i18n instance.
 * Initializes with defaults if not already initialized.
 */
export function getI18n(): typeof i18n {
  if (!initialized) {
    initializeI18n();
  }
  return i18n;
}

export { i18n };
export default i18n;
