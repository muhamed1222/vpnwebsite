import { NextRequest, NextResponse } from 'next/server';
import { validateTelegramInitData } from '@/lib/telegram-validation';
import { serverConfig } from '@/lib/config';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.outlivion.space';

/**
 * API Route для получения данных пользователя
 * 
 * Проксирует GET запрос на бэкенд API /api/me
 */
export async function GET(request: NextRequest) {
  try {
    // Получаем initData из заголовков
    const initData = request.headers.get('X-Telegram-Init-Data') ||
      request.headers.get('Authorization');

    if (!initData) {
      return NextResponse.json(
        { error: 'Missing Telegram initData' },
        { status: 401 }
      );
    }

    // Валидируем подпись initData на стороне Next.js для безопасности
    const botToken = serverConfig.telegram.botToken;

    if (!botToken) {
      console.error('[API /me] CRITICAL ERROR: TELEGRAM_BOT_TOKEN is not set in environment variables');
      return NextResponse.json(
        { error: 'Внутренняя ошибка конфигурации сервера' },
        { status: 500 }
      );
    }

    const isValid = validateTelegramInitData(
      initData,
      botToken
    );

    if (!isValid) {
      return NextResponse.json(
        { error: 'Невалидная подпись данных Telegram. Пожалуйста, перезапустите приложение.' },
        { status: 401 }
      );
    }
    // Если токен не установлен, просто проксируем запрос на бэкенд

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
      console.log('[API /me] Backend response status:', backendResponse.status);
      if (!backendResponse.ok) {
        const errorText = await backendResponse.clone().text().catch(() => '');
        console.error('[API /me] Backend error:', errorText);
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
    console.error('Me API error:', error);

    // Обработка сетевых ошибок
    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return NextResponse.json(
          { error: 'Проблема с подключением к серверу. Проверьте интернет-соединение.' },
          { status: 0 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера. Попробуйте позже.' },
      { status: 500 }
    );
  }
}

