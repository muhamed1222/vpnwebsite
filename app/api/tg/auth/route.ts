import { NextRequest, NextResponse } from 'next/server';
import { validateApiRequest, getValidatedInitData } from '@/lib/utils/api-validation';
import { logError } from '@/lib/utils/logging';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.outlivion.space';

/**
 * API Route для авторизации через Telegram WebApp
 * 
 * Проксирует запрос на бэкенд API для получения данных пользователя и подписки
 */
export async function POST(request: NextRequest) {
  try {
    // Валидируем запрос с помощью централизованной утилиты
    const validationError = validateApiRequest(request, true);
    if (validationError) {
      return validationError;
    }

    // Получаем валидированный initData
    const initData = getValidatedInitData(request);
    if (!initData) {
      return NextResponse.json(
        { error: 'Missing Telegram initData' },
        { status: 401 }
      );
    }

    // Проксируем запрос на бэкенд API
    const backendResponse = await fetch(`${BACKEND_API_URL}/api/me`, {
      method: 'GET',
      headers: {
        'Authorization': initData,
        'Content-Type': 'application/json',
      },
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      
      // Формируем понятное сообщение об ошибке
      let errorMessage = errorData.error || errorData.message;
      
      if (!errorMessage) {
        switch (backendResponse.status) {
          case 401:
            errorMessage = 'Ошибка авторизации. Пожалуйста, перезапустите приложение.';
            break;
          case 403:
            errorMessage = 'Доступ запрещен. Проверьте права доступа.';
            break;
          case 404:
            errorMessage = 'Запрашиваемый ресурс не найден.';
            break;
          case 500:
            errorMessage = 'Ошибка сервера. Попробуйте позже.';
            break;
          case 503:
            errorMessage = 'Сервис временно недоступен. Попробуйте позже.';
            break;
          default:
            errorMessage = `Ошибка сервера (${backendResponse.status}). Попробуйте позже.`;
        }
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: backendResponse.status }
      );
    }

    const backendData = await backendResponse.json();

    // Преобразуем формат ответа для совместимости с фронтендом
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
  } catch (error) {
    logError('Auth API error', error, {
      page: 'api',
      action: 'auth',
      endpoint: '/api/tg/auth'
    });
    
    // Обработка сетевых ошибок
    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return NextResponse.json(
          { error: 'Проблема с подключением к серверу. Проверьте интернет-соединение.' },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера. Попробуйте позже.' },
      { status: 500 }
    );
  }
}

