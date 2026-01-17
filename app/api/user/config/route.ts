import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/utils/api-proxy';
import { validateApiRequest } from '@/lib/utils/api-validation';

/**
 * API Route для получения VPN конфигурации пользователя
 * 
 * Проксирует запрос на бэкенд API для получения VPN ключа
 */
export async function GET(request: NextRequest) {
  // Валидируем запрос
  const validationError = validateApiRequest(request, true);
  if (validationError) {
    return validationError;
  }

  // Проксируем запрос на бэкенд API
  const response = await proxyGet(request, '/v1/user/config', {
    requireAuth: true,
    logContext: {
      page: 'api',
      action: 'getUserConfig',
      endpoint: '/api/user/config',
    },
  });

  // Если ошибка, возвращаем стандартный формат
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    if (data.error) {
      return response; // Возвращаем ошибку как есть
    }
    // Если нет ошибки в формате, возвращаем стандартный формат
    return new Response(JSON.stringify({
      ok: false,
      config: null,
    }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Парсим успешный ответ и нормализуем формат
  const data = await response.json().catch(() => ({}));
  return new Response(JSON.stringify({
    ok: data.ok || false,
    config: data.config || null,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

