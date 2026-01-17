import { NextRequest, NextResponse } from 'next/server';
import { proxyGet } from '@/lib/utils/api-proxy';
import { validateApiRequest } from '@/lib/utils/api-validation';

/**
 * API Route для авторизации через Telegram WebApp
 * 
 * Проксирует запрос на бэкенд API для получения данных пользователя и подписки
 */
export async function POST(request: NextRequest) {
  // Валидируем запрос
  const validationError = validateApiRequest(request, true);
  if (validationError) {
    return validationError;
  }

  // Проксируем запрос на бэкенд API
  const response = await proxyGet(request, '/api/me', {
    requireAuth: true,
    logContext: {
      page: 'api',
      action: 'auth',
      endpoint: '/api/tg/auth',
    },
  });

  // Если ошибка, возвращаем как есть
  if (!response.ok) {
    return response;
  }

  // Преобразуем формат ответа для совместимости с фронтендом
  const backendData = await response.json().catch(() => ({}));
  
  const isActive = backendData.subscription?.is_active && 
                   backendData.subscription?.expires_at && 
                   backendData.subscription.expires_at > Date.now();
  
  const isExpired = backendData.subscription?.expires_at && 
                    backendData.subscription.expires_at <= Date.now();

  return NextResponse.json({
    user: {
      id: backendData.id,
      firstName: backendData.firstName,
      username: undefined,
    },
    subscription: {
      status: isActive ? 'active' as const : isExpired ? 'expired' as const : 'none' as const,
      expiresAt: backendData.subscription?.expires_at 
        ? new Date(backendData.subscription.expires_at).toISOString().split('T')[0]
        : undefined,
    },
  });
}

