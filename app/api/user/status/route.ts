import { NextRequest, NextResponse } from 'next/server';
import { validateTelegramInitData } from '@/lib/telegram-validation';
import { serverConfig } from '@/lib/config';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.outlivion.space';

/**
 * API Route для получения статуса пользователя и статистики использования
 * 
 * Проксирует запрос на бэкенд API для получения статистики трафика
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

    // Получаем данные пользователя для определения статуса
    const userResponse = await fetch(`${BACKEND_API_URL}/api/me`, {
      method: 'GET',
      headers: {
        'Authorization': initData,
        'Content-Type': 'application/json',
      },
    });

    if (!userResponse.ok) {
      return NextResponse.json({
        ok: false,
        status: 'disabled' as const,
        expiresAt: null,
        usedTraffic: 0,
        dataLimit: 0,
      });
    }

    const userData = await userResponse.json();
    const isActive = userData.subscription?.is_active && 
                     userData.subscription?.expires_at && 
                     userData.subscription.expires_at > Date.now();

    // Получаем статистику использования трафика
    const billingResponse = await fetch(`${BACKEND_API_URL}/api/billing`, {
      method: 'GET',
      headers: {
        'Authorization': initData,
        'Content-Type': 'application/json',
      },
    });

    let billingData = {
      usedBytes: 0,
      limitBytes: null,
    };

    if (billingResponse.ok) {
      billingData = await billingResponse.json();
    }

    return NextResponse.json({
      ok: isActive,
      status: isActive ? 'active' as const : 'disabled' as const,
      expiresAt: userData.subscription?.expires_at || null,
      usedTraffic: billingData.usedBytes || 0,
      dataLimit: billingData.limitBytes || 0,
    });
  } catch (error) {
    console.error('Status API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

