import { NextRequest, NextResponse } from 'next/server';
import { validateTelegramInitData, extractUserFromInitData } from '@/lib/telegram-validation';
import { serverConfig } from '@/lib/config';

/**
 * API Route для получения статуса пользователя и статистики использования
 * 
 * Валидирует initData от Telegram и возвращает статистику использования трафика
 */
export async function GET(request: NextRequest) {
  try {
    // Получаем initData из заголовков
    const initData = request.headers.get('X-Telegram-Init-Data');

    if (!initData) {
      return NextResponse.json(
        { error: 'Missing Telegram initData' },
        { status: 401 }
      );
    }

    // Валидируем подпись initData
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

    // Извлекаем данные пользователя
    const telegramUser = extractUserFromInitData(initData);

    if (!telegramUser) {
      return NextResponse.json(
        { error: 'Failed to extract user data' },
        { status: 400 }
      );
    }

    // TODO: Здесь должна быть интеграция с реальным бэкендом
    // В production здесь должен быть запрос к вашему API для получения статистики
    // Пример:
    // const backendResponse = await fetch(`${config.api.baseUrl}/api/user/status`, {
    //   method: 'GET',
    //   headers: {
    //     'Authorization': `Bearer ${telegramUser.id}`,
    //   },
    // });
    // const statusData = await backendResponse.json();

    // Временная заглушка (убрать в production)
    return NextResponse.json({
      ok: true,
      status: 'active' as const,
      expiresAt: null,
      usedTraffic: 0,
      dataLimit: 0,
    });

    // Когда будет готов бэкенд, раскомментировать:
    // return NextResponse.json({
    //   ok: true,
    //   status: statusData.status,
    //   expiresAt: statusData.expiresAt,
    //   usedTraffic: statusData.usedTraffic,
    //   dataLimit: statusData.dataLimit,
    // });
  } catch (error) {
    console.error('Status API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

