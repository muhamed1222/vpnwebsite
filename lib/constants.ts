/**
 * Константы приложения
 * Все магические числа и строки должны быть вынесены сюда
 */

// Subscription Configuration
export const SUBSCRIPTION_CONFIG = {
  DEFAULT_SUBSCRIPTION_ID: 'EyR56URS1GQXgcLS',
  DEFAULT_DEVICES_COUNT: 5,
  MIN_PRICE: 10,
} as const;

// App Store URLs
export const APP_STORE_URLS = {
  iOS: 'https://apps.apple.com/app/hiddify/id6473773752',
  macOS: 'https://apps.apple.com/app/hiddify/id6473773752',
  Android: 'https://play.google.com/store/apps/details?id=app.hiddify.com',
  Desktop: 'https://github.com/hiddify/hiddify-next/releases',
} as const;

// Deep Link Protocol
export const DEEP_LINK_PROTOCOL = 'happ://add' as const;

// Animation Durations (ms)
export const ANIMATION_DURATIONS = {
  MODAL_CLOSE: 850,
  BACKDROP: 400,
  MODAL: 850,
} as const;

// API Configuration
export const API_CONFIG = {
  TIMEOUT: 10000, // 10 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// UI Constants
export const UI_CONSTANTS = {
  DRAG_THRESHOLD: 100, // pixels to drag before closing modal
  MAX_MODAL_HEIGHT: '92vh',
} as const;

// Colors (for reference, actual colors in Tailwind classes)
export const COLORS = {
  PRIMARY: '#F55128',
  PRIMARY_HOVER: '#d43d1f',
  SECONDARY: '#121212',
  SUCCESS: '#21A038',
  WARNING: '#D9A14E',
  ERROR: '#F55128',
} as const;

