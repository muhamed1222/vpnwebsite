import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/utils/api-proxy';
import { validateApiRequest } from '@/lib/utils/api-validation';

/**
 * API Route для создания заказа
 * 
 * Проксирует POST запрос на бэкенд API /v1/orders/create
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
  return proxyPost(request, '/v1/orders/create', body, {
    requireAuth: true,
    logContext: {
      page: 'api',
      action: 'createOrder',
      endpoint: '/api/orders/create',
    },
  });
}

