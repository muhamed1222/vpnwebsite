/**
 * Структурированное логирование для приложения
 * Интегрировано с аналитикой для отслеживания ошибок
 */

import { analytics } from '../analytics';
import { safeStringify, createSafeLogContext } from './sanitize';

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
  // Безопасное извлечение сообщения об ошибке
  let errorMessage: string;
  let errorStack: string | undefined;
  
  // Проверка на пустой объект
  const isEmptyObject = error && typeof error === 'object' && Object.keys(error).length === 0;
  
  if (isEmptyObject) {
    // Если передан пустой объект, используем только сообщение
    errorMessage = message;
  } else if (error instanceof Error) {
    errorMessage = error.message || message;
    errorStack = error.stack;
  } else if (error && typeof error === 'object') {
    // Обработка Response объектов и других объектов
    if ('status' in error && 'statusText' in error) {
      // Это Response объект
      errorMessage = `HTTP ${(error as { status: number }).status}: ${(error as { statusText: string }).statusText || message}`;
    } else if ('message' in error && typeof (error as { message: unknown }).message === 'string') {
      errorMessage = (error as { message: string }).message;
    } else {
      // Пытаемся сериализовать объект безопасно (с санитизацией)
      try {
        const serialized = safeStringify(error);
        // Если объект пустой после сериализации, используем сообщение
        errorMessage = serialized === '{}' || serialized === '[Unable to serialize data]' ? message : serialized;
      } catch {
        errorMessage = message;
      }
    }
  } else if (error !== null && error !== undefined) {
    errorMessage = String(error);
  } else {
    errorMessage = message;
  }
  
  // В development режиме выводим в консоль для отладки
  // Используем только строки, чтобы избежать проблем с сериализацией объектов
  // Санитизируем контекст перед логированием
  if (process.env.NODE_ENV === 'development') {
    try {
      const safeContext = createSafeLogContext(context);
      const contextStr = safeContext && typeof safeContext === 'object' && Object.keys(safeContext).length > 0
        ? safeStringify(safeContext)
        : '';
      const stackStr = errorStack ? `\nStack: ${errorStack}` : '';
      
      // Логируем как строку, чтобы избежать проблем с Next.js
      const logMessage = `[Error] ${message}\nError: ${errorMessage}${stackStr}${contextStr ? `\nContext: ${contextStr}` : ''}`;
      console.error(logMessage);
    } catch {
      // Fallback если что-то пошло не так
      console.error(`[Error] ${message}: ${errorMessage}`);
    }
  }

  // Отправляем в аналитику для отслеживания
  try {
    analytics.error(errorMessage, context?.page || context?.action || 'unknown');
  } catch (e) {
    // Игнорируем ошибки аналитики, чтобы не ломать приложение
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Analytics] Failed to track error:', e);
    }
  }

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
  const safeContext = createSafeLogContext(context);
  const logEntry = {
    level: 'warn' as const,
    message,
    timestamp: new Date().toISOString(),
    ...safeContext,
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
  const safeContext = createSafeLogContext(context);
  const logEntry = {
    level: 'info' as const,
    message,
    timestamp: new Date().toISOString(),
    ...safeContext,
  };

  // В development режиме выводим в консоль
  if (process.env.NODE_ENV === 'development') {
    console.log('[Info]', logEntry);
  }

  // В production можно отправлять в сервис логирования
}
