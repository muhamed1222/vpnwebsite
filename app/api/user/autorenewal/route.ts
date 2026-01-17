import { NextRequest } from 'next/server';
import { proxyGet, proxyPost } from '@/lib/utils/api-proxy';
import { validateApiRequest } from '@/lib/utils/api-validation';

/**
 * API Route для получения статуса автопродления
 * GET /api/user/autorenewal
 */
export async function GET(request: NextRequest) {
  // Валидируем запрос
  const validationError = validateApiRequest(request, true);
  if (validationError) {
    return validationError;
  }

  // Проксируем запрос на бэкенд API
  return proxyGet(request, '/v1/user/autorenewal', {
    requireAuth: true,
    logContext: {
      page: 'api',
      action: 'getAutorenewal',
      endpoint: '/api/user/autorenewal',
    },
  });
}

/**
 * API Route для обновления статуса автопродления
 * POST /api/user/autorenewal
 */
export async function POST(request: NextRequest) {
  // Валидируем запрос
  const validationError = validateApiRequest(request, true);
  if (validationError) {
    return validationError;
  }

  // Получаем тело запроса
  const body = await request.json().catch(() => ({}));

  // Проксируем запрос на бэкенд API
  return proxyPost(request, '/v1/user/autorenewal', body, {
    requireAuth: true,
    logContext: {
      page: 'api',
      action: 'updateAutorenewal',
      endpoint: '/api/user/autorenewal',
    },
  });
}
