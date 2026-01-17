import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/utils/api-proxy';
import { validateApiRequest } from '@/lib/utils/api-validation';

/**
 * API Route для получения статистики использования
 * 
 * Проксирует GET запрос на бэкенд API /v1/user/billing
 */
export async function GET(request: NextRequest) {
  // Валидируем запрос
  const validationError = validateApiRequest(request, true);
  if (validationError) {
    return validationError;
  }

  // Проксируем запрос на бэкенд API
  return proxyGet(request, '/v1/user/billing', {
    requireAuth: true,
    logContext: {
      page: 'api',
      action: 'getBilling',
      endpoint: '/api/user/billing',
    },
  });
}

