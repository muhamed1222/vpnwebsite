/**
 * Утилиты для обработки API routes
 * Устраняет дублирование кода в обработчиках API
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateApiRequest, getValidatedInitData } from './api-validation';
import { logError } from './logging';
import { getUserFriendlyMessage } from './user-messages';

/**
 * Контекст для обработки ошибок
 */
export interface ApiHandlerContext {
  page?: string;
  action?: string;
  endpoint?: string;
  [key: string]: unknown;
}

/**
 * Обрабатывает ошибки в API handlers
 * 
 * @param error - Ошибка
 * @param context - Контекст для логирования
 * @returns NextResponse с ошибкой
 */
export function handleApiError(
  error: unknown,
  context: ApiHandlerContext = {}
): NextResponse {
  // Логируем ошибку
  logError('API handler error', error, context);

  // Обрабатываем сетевые ошибки
  if (error instanceof Error) {
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return NextResponse.json(
        { error: 'Проблема с подключением к серверу. Проверьте интернет-соединение.' },
        { status: 503 }
      );
    }
  }

  // Общая ошибка
  return NextResponse.json(
    { error: getUserFriendlyMessage(error instanceof Error ? error.message : 'Внутренняя ошибка сервера. Попробуйте позже.') },
    { status: 500 }
  );
}

/**
 * Обертка для API handlers с автоматической обработкой ошибок
 * 
 * @param handler - Функция-обработчик
 * @param request - Next.js request объект
 * @param context - Контекст для логирования
 * @returns NextResponse
 */
export async function withApiErrorHandling(
  handler: (request: NextRequest) => Promise<NextResponse>,
  request: NextRequest,
  context: ApiHandlerContext = {}
): Promise<NextResponse> {
  try {
    return await handler(request);
  } catch (error) {
    return handleApiError(error, context);
  }
}

/**
 * Создает API handler с валидацией и обработкой ошибок
 * 
 * @param handler - Функция-обработчик
 * @param options - Опции
 * @returns Функция-обработчик для Next.js
 */
export function createApiHandler(
  handler: (request: NextRequest, initData: string | null) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean;
    context?: ApiHandlerContext;
  } = {}
): (request: NextRequest) => Promise<NextResponse> {
  const { requireAuth = true, context = {} } = options;

  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Валидируем запрос
      if (requireAuth) {
        const validationError = validateApiRequest(request, requireAuth);
        if (validationError) {
          return validationError;
        }
      }

      // Получаем initData
      const initData = requireAuth ? getValidatedInitData(request) : null;
      if (requireAuth && !initData) {
        return NextResponse.json(
          { error: 'Missing Telegram initData' },
          { status: 401 }
        );
      }

      // Вызываем handler
      return await handler(request, initData);
    } catch (error) {
      return handleApiError(error, context);
    }
  };
}
