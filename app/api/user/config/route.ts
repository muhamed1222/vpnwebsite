import { NextRequest, NextResponse } from 'next/server';
import { validateTelegramInitData, extractUserFromInitData } from '@/lib/telegram-validation';
import { serverConfig } from '@/lib/config';

/**
 * API Route для получения VPN конфигурации пользователя
 * 
 * Валидирует initData от Telegram и возвращает VPN ключ пользователя
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
    // В production здесь должен быть запрос к вашему API для получения VPN конфигурации
    // Пример:
    // const backendResponse = await fetch(`${config.api.baseUrl}/api/user/config`, {
    //   method: 'GET',
    //   headers: {
    //     'Authorization': `Bearer ${telegramUser.id}`,
    //   },
    // });
    // const configData = await backendResponse.json();

    // Временная заглушка (убрать в production)
    // Возвращаем пустой ответ, так как реальный VPN ключ должен приходить с бэкенда
    return NextResponse.json({
      ok: false,
      config: null,
    });

    // Когда будет готов бэкенд, раскомментировать:
    // return NextResponse.json({
    //   ok: true,
    //   config: configData.vpnKey, // VPN ключ в формате строки
    // });
  } catch (error) {
    console.error('Config API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

