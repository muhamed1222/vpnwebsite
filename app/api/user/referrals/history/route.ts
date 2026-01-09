import { NextRequest, NextResponse } from 'next/server';
import { validateTelegramInitData } from '@/lib/telegram-validation';
import { serverConfig } from '@/lib/config';
import { logError } from '@/lib/utils/logging';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.outlivion.space';

/**
 * API Route для получения истории начислений рефералов
 * 
 * Проксирует GET запрос на бэкенд API /v1/user/referrals/history
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

    // Валидируем подпись initData (если токен установлен)
    if (serverConfig.telegram.botToken) {
      const isValid = validateTelegramInitData(
        initData,
        serverConfig.telegram.botToken
      );

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid Telegram initData signature' },
          { status: 401 }
        );
      }
    }

    // Проксируем запрос на бэкенд API с initData в Authorization header
    const backendResponse = await fetch(`${BACKEND_API_URL}/v1/user/referrals/history`, {
      method: 'GET',
      headers: {
        'Authorization': initData, // initData в Authorization header
        'Content-Type': 'application/json',
      },
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Ошибка загрузки истории начислений' },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    logError('Referrals history API error', error, {
      page: 'api',
      action: 'getReferralHistory',
      endpoint: '/api/user/referrals/history'
    });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера. Попробуйте позже.' },
      { status: 500 }
    );
  }
}
