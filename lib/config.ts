/**
 * Конфигурация приложения
 * 
 * Разделение на серверный и клиентский конфиг:
 * - Серверные переменные (NEXT_PUBLIC_*) доступны на клиенте
 * - Остальные доступны только на сервере
 */

function getServerEnvVar(key: string, defaultValue?: string): string {
  // Только на сервере
  if (typeof window !== 'undefined') {
    return defaultValue || '';
  }
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue || '';
}

function getClientEnvVar(key: string, defaultValue: string): string {
  // NEXT_PUBLIC_ переменные доступны на клиенте
  const value = process.env[key];
  return value || defaultValue;
}

// Серверный конфиг (доступен только в API routes)
export const serverConfig = {
  telegram: {
    botToken: getServerEnvVar('TELEGRAM_BOT_TOKEN', ''),
  },
  env: {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    nodeEnv: process.env.NODE_ENV || 'development',
  },
} as const;

// Клиентский конфиг (доступен везде)
export const config = {
  api: {
    baseUrl: getClientEnvVar('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:3000'),
  },
  payment: {
    redirectUrl: getClientEnvVar('NEXT_PUBLIC_PAYMENT_REDIRECT_URL', 'https://redirect.ultima.foundation'),
    subscriptionBaseUrl: getClientEnvVar('NEXT_PUBLIC_SUBSCRIPTION_BASE_URL', 'https://gate.ultima.foundation'),
  },
  support: {
    telegramUrl: getClientEnvVar('NEXT_PUBLIC_SUPPORT_TELEGRAM_URL', 'https://t.me/outlivion_support'),
    helpBaseUrl: getClientEnvVar('NEXT_PUBLIC_HELP_BASE_URL', 'https://help.outlivion.space'),
  },
} as const;

