/**
 * Централизованная обработка ошибок
 * Преобразует технические ошибки в понятные пользовательские сообщения
 */

import { ApiException } from '../api';
import { logError } from './logging';
import { triggerHaptic } from '../telegram';
import { checkTelegramWebApp } from '../telegram-fallback';

export interface ErrorContext {
  page?: string;
  action?: string;
  userId?: string | number;
  [key: string]: unknown;
}

/**
 * Типы ошибок для категоризации
 */
export enum ErrorType {
  NETWORK = 'network',
  AUTH = 'auth',
  PERMISSION = 'permission',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown',
}

/**
 * Пользовательские сообщения для разных типов ошибок
 */
const USER_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.NETWORK]: 'Проблема с подключением к интернету. Проверьте соединение и попробуйте снова.',
  [ErrorType.AUTH]: 'Ошибка авторизации. Пожалуйста, перезапустите приложение.',
  [ErrorType.PERMISSION]: 'Недостаточно прав для выполнения этого действия.',
  [ErrorType.NOT_FOUND]: 'Запрашиваемый ресурс не найден.',
  [ErrorType.SERVER]: 'Ошибка сервера. Попробуйте позже.',
  [ErrorType.VALIDATION]: 'Проверьте правильность введенных данных.',
  [ErrorType.UNKNOWN]: 'Что-то пошло не так. Попробуйте перезагрузить приложение.',
};

/**
 * Определяет тип ошибки на основе её характеристик
 */
function getErrorType(error: unknown): ErrorType {
  if (error instanceof ApiException) {
    if (error.status === 0 || error.message.includes('подключ') || error.message.includes('сеть')) {
      return ErrorType.NETWORK;
    }
    if (error.status === 401 || error.status === 403) {
      return error.status === 401 ? ErrorType.AUTH : ErrorType.PERMISSION;
    }
    if (error.status === 404) {
      return ErrorType.NOT_FOUND;
    }
    if (error.status >= 500) {
      return ErrorType.SERVER;
    }
    if (error.status >= 400 && error.status < 500) {
      return ErrorType.VALIDATION;
    }
  }

  if (error instanceof TypeError) {
    if (error.message === 'Failed to fetch' || error.message.includes('CORS')) {
      return ErrorType.NETWORK;
    }
  }

  if (error instanceof Error) {
    if (error.message.includes('авторизац') || error.message.includes('auth')) {
      return ErrorType.AUTH;
    }
    if (error.message.includes('доступ') || error.message.includes('permission')) {
      return ErrorType.PERMISSION;
    }
    if (error.message.includes('не найден') || error.message.includes('not found')) {
      return ErrorType.NOT_FOUND;
    }
  }

  return ErrorType.UNKNOWN;
}

/**
 * Извлекает понятное сообщение об ошибке для пользователя
 */
function getUserMessage(error: unknown, errorType: ErrorType): string {
  // Если это ApiException с уже понятным сообщением, используем его
  if (error instanceof ApiException && error.message) {
    // Проверяем, не является ли сообщение техническим
    const technicalPatterns = [
      'Failed to fetch',
      'NetworkError',
      'CORS',
      'TypeError',
      'ReferenceError',
      'SyntaxError',
    ];

    const isTechnical = technicalPatterns.some(pattern => 
      error.message.includes(pattern)
    );

    if (!isTechnical) {
      // Сообщение уже понятное для пользователя
      return error.message;
    }
  }

  // Если это обычная Error с понятным сообщением на русском
  if (error instanceof Error && error.message) {
    const technicalPatterns = [
      'Failed to fetch',
      'NetworkError',
      'CORS',
      'TypeError',
      'ReferenceError',
      'SyntaxError',
    ];

    const isTechnical = technicalPatterns.some(pattern => 
      error.message.includes(pattern)
    );

    if (!isTechnical && /[а-яё]/i.test(error.message)) {
      // Сообщение на русском и не техническое
      return error.message;
    }
  }

  // Используем стандартное сообщение для типа ошибки
  return USER_MESSAGES[errorType];
}

/**
 * Показывает ошибку пользователю через Telegram WebApp или alert
 */
async function showErrorToUser(message: string): Promise<void> {
  try {
    const { isAvailable, webApp } = checkTelegramWebApp();
    
    if (isAvailable && webApp) {
      // Используем Telegram WebApp API для показа ошибки
      webApp.showAlert(message);
      // Вибрация для привлечения внимания
      triggerHaptic('error');
    } else if (typeof window !== 'undefined') {
      // Fallback для браузера
      alert(message);
    }
  } catch (e) {
    // Если не удалось показать через WebApp, используем console
    console.error('[Error Handler] Failed to show error to user:', e);
    if (typeof window !== 'undefined') {
      alert(message);
    }
  }
}

/**
 * Централизованная обработка ошибок
 * 
 * @param error - Ошибка для обработки
 * @param context - Контекст ошибки (страница, действие и т.д.)
 * @param showToUser - Показывать ли ошибку пользователю (по умолчанию true)
 * @param logError - Логировать ли ошибку (по умолчанию true)
 * @returns Понятное сообщение об ошибке для пользователя
 */
export function handleError(
  error: unknown,
  context?: ErrorContext,
  options?: {
    showToUser?: boolean;
    logError?: boolean;
  }
): string {
  const { showToUser = true, logError: shouldLog = true } = options || {};

  // Определяем тип ошибки
  const errorType = getErrorType(error);
  
  // Получаем понятное сообщение для пользователя
  const userMessage = getUserMessage(error, errorType);

  // Логируем техническую информацию (если нужно)
  if (shouldLog) {
    const technicalMessage = error instanceof Error 
      ? error.message 
      : error instanceof ApiException
        ? `${error.message} (status: ${error.status})`
        : String(error);

    logError(
      `[Error Handler] ${userMessage}`,
      error,
      {
        ...context,
        errorType,
        technicalMessage,
      }
    );
  }

  // Показываем ошибку пользователю (если нужно)
  if (showToUser) {
    showErrorToUser(userMessage).catch((e) => {
      console.error('[Error Handler] Failed to show error:', e);
    });
  }

  return userMessage;
}

/**
 * Обработчик ошибок для API запросов
 * Автоматически обрабатывает ApiException и другие ошибки
 */
export function handleApiError(
  error: unknown,
  context?: ErrorContext,
  options?: {
    showToUser?: boolean;
    logError?: boolean;
  }
): string {
  return handleError(error, {
    ...context,
    action: context?.action || 'api_request',
  }, options);
}

/**
 * Обработчик ошибок для React компонентов
 * Можно использовать в catch блоках компонентов
 */
export function handleComponentError(
  error: unknown,
  componentName: string,
  action?: string
): string {
  return handleError(error, {
    page: componentName,
    action: action || 'component_action',
  });
}

/**
 * Обертка для async функций с автоматической обработкой ошибок
 */
export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: ErrorContext
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleApiError(error, context);
      throw error; // Пробрасываем ошибку дальше для обработки в компоненте
    }
  }) as T;
}

/**
 * Создает обработчик ошибок для конкретного контекста
 */
export function createErrorHandler(context: ErrorContext) {
  return {
    handle: (error: unknown, options?: { showToUser?: boolean; logError?: boolean }) => 
      handleError(error, context, options),
    handleApi: (error: unknown) => handleApiError(error, context),
    handleComponent: (error: unknown, action?: string) => 
      handleComponentError(error, context.page || 'unknown', action),
  };
}
