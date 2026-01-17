import { NextRequest, NextResponse } from 'next/server';
import { validateApiRequest, getValidatedInitData } from '@/lib/utils/api-validation';
import { logError } from '@/lib/utils/logging';
import { sanitizeForLogging } from '@/lib/utils/sanitize';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.outlivion.space';

/**
 * API Route для получения данных пользователя
 * 
 * Проксирует GET запрос на бэкенд API /api/me
 */
export async function GET(request: NextRequest) {
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
    // vpn_api теперь поддерживает initData в Authorization header
    const backendResponse = await fetch(`${BACKEND_API_URL}/v1/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': initData, // initData в Authorization header
        'Content-Type': 'application/json',
      },
    });

    // Логируем для отладки (только в development)
    if (process.env.NODE_ENV === 'development') {
      // В development режиме логируем для отладки
      if (!backendResponse.ok) {
        const errorText = await backendResponse.clone().text().catch(() => '');
        // Санитизируем errorText перед логированием (на случай, если там есть чувствительные данные)
        const sanitizedError = typeof errorText === 'string' && errorText.length > 0
          ? String(sanitizeForLogging(errorText))
          : 'Unknown error';
        logError('[API /me] Backend error', new Error(sanitizedError), {
          page: 'api',
          action: 'backendRequest',
          endpoint: '/api/me',
          status: backendResponse.status
        });
      }
    }

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

    // Возвращаем данные в формате бэкенда (без преобразования)
    // Преобразование будет сделано в клиентском коде
    return NextResponse.json(backendData);
  } catch (error) {
    logError('Me API error', error, {
      page: 'api',
      action: 'getUserData',
      endpoint: '/api/me'
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

