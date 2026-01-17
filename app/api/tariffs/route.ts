import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/utils/api-proxy';
import { validateApiRequest } from '@/lib/utils/api-validation';

/**
 * API Route для получения тарифов
 * 
 * Проксирует GET запрос на бэкенд API /v1/tariffs
 */
export async function GET(request: NextRequest) {
  // Тарифы могут быть доступны без авторизации, но если initData есть, валидируем
  const initData = request.headers.get('X-Telegram-Init-Data') || 
                   request.headers.get('Authorization');

  // Если initData есть, валидируем его
  if (initData) {
    const validationError = validateApiRequest(request, false);
    if (validationError) {
      return validationError;
    }
  }

  // Проксируем запрос на бэкенд API с кэшированием
  return proxyGet(request, '/v1/tariffs', {
    requireAuth: false, // Тарифы доступны без авторизации
    revalidate: 3600, // Кешируем на 1 час
    logContext: {
      page: 'api',
      action: 'getTariffs',
      endpoint: '/api/tariffs',
    },
  });
}

