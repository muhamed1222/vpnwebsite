import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/utils/api-proxy';
import { validateApiRequest } from '@/lib/utils/api-validation';

/**
 * API Route для получения данных пользователя
 * 
 * Проксирует GET запрос на бэкенд API /v1/auth/me
 */
export async function GET(request: NextRequest) {
  // Валидируем запрос
  const validationError = validateApiRequest(request, true);
  if (validationError) {
    return validationError;
  }

  // Проксируем запрос на бэкенд API
  return proxyGet(request, '/v1/auth/me', {
    requireAuth: true,
    logContext: {
      page: 'api',
      action: 'getUserData',
      endpoint: '/api/me',
    },
  });
}

