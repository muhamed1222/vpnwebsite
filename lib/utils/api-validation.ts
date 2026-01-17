/**
 * Утилиты для валидации запросов в API routes
 * Централизованная валидация Telegram initData
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateTelegramInitData } from '@/lib/telegram-validation';
import { serverConfig } from '@/lib/config';

/**
 * Результат валидации initData
 */
export interface ValidationResult {
  isValid: boolean;
  initData: string | null;
  error?: string;
  status?: number;
}

/**
 * Валидирует Telegram initData из запроса
 * 
 * @param request - Next.js request объект
 * @param requireAuth - Требовать ли авторизацию (по умолчанию true)
 * @returns Результат валидации
 */
export function validateRequestInitData(
  request: NextRequest,
  requireAuth: boolean = true
): ValidationResult {
  // Получаем initData из заголовков
  const initData = request.headers.get('X-Telegram-Init-Data') ||
    request.headers.get('Authorization');

  if (!initData) {
    if (requireAuth) {
      return {
        isValid: false,
        initData: null,
        error: 'Missing Telegram initData',
        status: 401,
      };
    }
    // Если авторизация не требуется, возвращаем успех без initData
    return {
      isValid: true,
      initData: null,
    };
  }

  // В режиме разработки пропускаем валидацию для STUB initData
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isStubData = initData.includes('query_id=STUB');

  // Если это STUB данные в dev режиме, пропускаем валидацию
  if (isDevelopment && isStubData) {
    return {
      isValid: true,
      initData,
    };
  }

  // Получаем токен бота
  const botToken = serverConfig.telegram.botToken;

  if (!botToken) {
    // В production токен должен быть установлен
    if (!isDevelopment) {
      return {
        isValid: false,
        initData: null,
        error: 'Внутренняя ошибка конфигурации сервера',
        status: 500,
      };
    }
    // В dev режиме без токена пропускаем валидацию (бэкенд проверит)
    // Но логируем предупреждение
    console.warn('[API Validation] TELEGRAM_BOT_TOKEN not set, skipping validation in dev mode');
    return {
      isValid: true,
      initData,
    };
  }

  // Валидируем подпись initData
  const isValid = validateTelegramInitData(initData, botToken);

  if (!isValid) {
    return {
      isValid: false,
      initData: null,
      error: 'Невалидная подпись данных Telegram. Пожалуйста, перезапустите приложение.',
      status: 401,
    };
  }

  return {
    isValid: true,
    initData,
  };
}

/**
 * Middleware для валидации initData в API routes
 * 
 * @param request - Next.js request объект
 * @param requireAuth - Требовать ли авторизацию (по умолчанию true)
 * @returns NextResponse с ошибкой или null, если валидация прошла успешно
 */
export function validateApiRequest(
  request: NextRequest,
  requireAuth: boolean = true
): NextResponse | null {
  const validation = validateRequestInitData(request, requireAuth);

  if (!validation.isValid) {
    return NextResponse.json(
      { error: validation.error || 'Unauthorized' },
      { status: validation.status || 401 }
    );
  }

  return null; // Валидация прошла успешно
}

/**
 * Извлекает initData из запроса (после валидации)
 * 
 * @param request - Next.js request объект
 * @returns initData строка или null
 */
export function getValidatedInitData(request: NextRequest): string | null {
  return request.headers.get('X-Telegram-Init-Data') ||
    request.headers.get('Authorization');
}
