/**
 * Константы приложения
 * Все магические числа и строки должны быть вынесены сюда
 */

// VPN Application Name
export const VPN_APP_NAME = 'v2RayTun' as const;

// Subscription Configuration
export const SUBSCRIPTION_CONFIG = {
  DEFAULT_SUBSCRIPTION_ID: 'EyR56URS1GQXgcLS',
  DEFAULT_DEVICES_COUNT: 5,
  MIN_PRICE: 10,
} as const;

// App Store URLs
export const APP_STORE_URLS = {
  iOS: 'https://apps.apple.com/ru/app/v2raytun/id6476628951',
  macOS: 'https://apps.apple.com/ru/app/v2raytun/id6476628951',
  Android: 'https://play.google.com/store/apps/details?id=com.v2raytun.android',
  Desktop: 'https://storage.v2raytun.com/v2RayTun_Setup.exe',
} as const;

// Deep Link Protocol
export const DEEP_LINK_PROTOCOL = 'happ://add/' as const;

// Animation Durations (ms)
export const ANIMATION_DURATIONS = {
  MODAL_CLOSE: 350,
  BACKDROP: 300,
  MODAL: 350,
} as const;

// API Configuration
export const API_CONFIG = {
  TIMEOUT: 10000, // 10 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// Time Delays (in milliseconds)
export const DELAYS = {
  // UI Delays
  COPY_FEEDBACK: 2000, // 2 seconds - время показа "Скопировано"
  PAYMENT_REDIRECT: 1000, // 1 second - задержка перед редиректом на оплату
  POLLING_RESET: 2500, // 2.5 seconds - задержка перед сбросом попыток полинга
  MODAL_CLOSE_ANIMATION: 150, // 150ms - анимация закрытия модалки
  CONTEST_REFRESH: 4000, // 4 seconds - задержка перед обновлением конкурса
  
  // Polling Configuration
  POLLING_INTERVAL: 2000, // 2 seconds - интервал проверки статуса платежа
  MAX_POLL_ATTEMPTS: 30, // 30 попыток = 1 минута (30 * 2 секунды)
  
  // Contest Refresh
  CONTEST_CHECK_INTERVAL: 1000, // 1 second - интервал проверки начала конкурса
} as const;

// Session Configuration (in milliseconds)
export const SESSION_CONFIG = {
  MAX_AGE_MS: 60 * 60 * 24 * 1000, // 24 часа в миллисекундах
  MAX_AGE_SECONDS: 60 * 60 * 24, // 24 часа в секундах
} as const;

// Cache Configuration (in seconds)
export const CACHE_CONFIG = {
  CONTEST_ACTIVE: 60, // 60 seconds - время кэширования активного конкурса
} as const;

// API Timeouts (in milliseconds)
export const API_TIMEOUTS = {
  GET_REFERRAL_STATS: 2 * 60 * 1000, // 2 минуты
  GET_REFERRAL_HISTORY: 2 * 60 * 1000, // 2 минуты
  GET_PAYMENTS_HISTORY: 2 * 60 * 1000, // 2 минуты
  GET_AUTORENEWAL: 60 * 1000, // 1 минута
  UPDATE_AUTORENEWAL: 2 * 60 * 1000, // 2 минуты
  GET_USER_STATUS: 1 * 60 * 1000, // 1 минута (используется для многих endpoints)
  GET_USER_CONFIG: 2 * 60 * 1000, // 2 минуты
  GET_USER_BILLING: 1 * 60 * 1000, // 1 минута
  CREATE_ORDER: 1 * 60 * 1000, // 1 минута
  GET_TARIFFS: 5 * 60 * 1000, // 5 минут
  GET_CONTEST_ACTIVE: 60 * 1000, // 1 минута
  GET_CONTEST_SUMMARY: 1 * 60 * 1000, // 1 минута
  GET_CONTEST_FRIENDS: 1 * 60 * 1000, // 1 минута
  GET_CONTEST_TICKETS: 1 * 60 * 1000, // 1 минута
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

