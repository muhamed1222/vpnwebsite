import { NextRequest, NextResponse } from 'next/server';
import { validateTelegramInitData } from '@/lib/telegram-validation';
import { serverConfig } from '@/lib/config';
import { logError } from '@/lib/utils/logging';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.outlivion.space';

/**
 * API Route для получения VPN конфигурации пользователя
 * 
 * Проксирует запрос на бэкенд API для получения VPN ключа
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

    // Получаем VPN конфигурацию напрямую с initData в Authorization header
    const configResponse = await fetch(`${BACKEND_API_URL}/v1/user/config`, {
      method: 'GET',
      headers: {
        'Authorization': initData, // initData в Authorization header
        'Content-Type': 'application/json',
      },
    });

    if (!configResponse.ok) {
      return NextResponse.json({
        ok: false,
        config: null,
      });
    }

    const configData = await configResponse.json();
    return NextResponse.json({
      ok: configData.ok || false,
      config: configData.config || null,
    });
  } catch (error) {
    logError('Config API error', error, {
      page: 'api',
      action: 'getUserConfig',
      endpoint: '/api/user/config'
    });
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

