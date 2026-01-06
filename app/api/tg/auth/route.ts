import { NextRequest, NextResponse } from 'next/server';
import { validateTelegramInitData, extractUserFromInitData } from '@/lib/telegram-validation';
import { serverConfig } from '@/lib/config';

/**
 * API Route для авторизации через Telegram WebApp
 * 
 * Валидирует initData от Telegram и возвращает данные пользователя и подписки
 */
export async function POST(request: NextRequest) {
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
    // Пока что возвращаем данные на основе валидного Telegram пользователя
    // В production здесь должен быть запрос к вашему API для получения подписки

    // Имитация задержки сети (убрать в production)
    if (serverConfig.env.isDevelopment) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // TODO: Заменить на реальный запрос к бэкенду
    // const backendResponse = await fetch(`${config.api.baseUrl}/api/user/subscription`, {
    //   method: 'GET',
    //   headers: {
    //     'Authorization': `Bearer ${telegramUser.id}`,
    //   },
    // });
    // const subscriptionData = await backendResponse.json();

    // Временная заглушка (убрать в production)
    const subscriptionData = {
      status: 'none' as const,
      expiresAt: undefined,
    };

    return NextResponse.json({
      user: {
        id: telegramUser.id,
        firstName: telegramUser.first_name,
        username: telegramUser.username,
      },
      subscription: subscriptionData,
    });
  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

