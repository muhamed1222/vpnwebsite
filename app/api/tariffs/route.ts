import { NextRequest, NextResponse } from 'next/server';
import { validateApiRequest, getValidatedInitData } from '@/lib/utils/api-validation';
import { logError } from '@/lib/utils/logging';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.outlivion.space';

/**
 * API Route для получения тарифов
 * 
 * Проксирует GET запрос на бэкенд API /api/tariffs
 */
export async function GET(request: NextRequest) {
  try {
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

    // Проксируем запрос на бэкенд API
    // Тарифы могут быть доступны без авторизации, но если initData есть, валидируем
    // Используем кеширование Next.js для статических данных (тарифы меняются редко)
    const backendResponse = await fetch(`${BACKEND_API_URL}/v1/tariffs`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Если initData есть, отправляем его (но роут может работать и без него)
        ...(initData ? { 'Authorization': initData } : {}),
      },
      next: { revalidate: 3600 }, // Кешируем на 1 час (3600 секунд)
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Ошибка загрузки тарифов' },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    logError('Tariffs API error', error, {
      page: 'api',
      action: 'getTariffs',
      endpoint: '/api/tariffs'
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

