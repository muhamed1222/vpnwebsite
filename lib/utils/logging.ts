/**
 * Структурированное логирование для приложения
 * Интегрировано с аналитикой для отслеживания ошибок
 */

import { analytics } from '../analytics';

export type LogLevel = 'error' | 'warn' | 'info';

export interface LogContext {
  userId?: string | number;
  page?: string;
  action?: string;
  [key: string]: unknown;
}

/**
 * Структурированное логирование ошибок
 */
export function logError(
  message: string,
  error?: Error | unknown,
  context?: LogContext
): void {
  const errorMessage = error instanceof Error ? error.message : String(error || message);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  const logEntry = {
    level: 'error' as const,
    message,
    error: errorMessage,
    stack: errorStack,
    timestamp: new Date().toISOString(),
    ...context,
  };

  // В development режиме выводим в консоль для отладки
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error]', logEntry);
  }

  // Отправляем в аналитику для отслеживания
  analytics.error(errorMessage, context?.page || context?.action || 'unknown');

  // В production можно отправлять в сервис логирования (Sentry, LogRocket и т.д.)
  // if (process.env.NODE_ENV === 'production') {
  //   // Sentry.captureException(error, { extra: context });
  // }
}

/**
 * Структурированное логирование предупреждений
 */
export function logWarn(
  message: string,
  context?: LogContext
): void {
  const logEntry = {
    level: 'warn' as const,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  // В development режиме выводим в консоль
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Warn]', logEntry);
  }

  // В production можно отправлять в сервис логирования
}

/**
 * Структурированное логирование информации
 */
export function logInfo(
  message: string,
  context?: LogContext
): void {
  const logEntry = {
    level: 'info' as const,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  // В development режиме выводим в консоль
  if (process.env.NODE_ENV === 'development') {
    console.log('[Info]', logEntry);
  }

  // В production можно отправлять в сервис логирования
}
