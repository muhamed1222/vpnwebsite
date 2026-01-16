import { NextRequest, NextResponse } from 'next/server';
import { validateTelegramInitData } from '@/lib/telegram-validation';
import { serverConfig } from '@/lib/config';
import { logError } from '@/lib/utils/logging';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.outlivion.space';

/**
 * API Route для получения активного конкурса
 */
export async function GET(request: NextRequest) {
  try {
    const initData = request.headers.get('X-Telegram-Init-Data') ||
      request.headers.get('Authorization');

    if (!initData) {
      // В режиме разработки возвращаем мок данные, чтобы можно было верифицировать UI
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          ok: true,
          contest: {
            id: 'dev-mock-contest',
            title: 'Тестовый Розыгрыш (Dev)',
            starts_at: '2026-01-20T00:00:00Z',
            ends_at: '2026-01-27T00:00:00Z',
            attribution_window_days: 7,
            rules_version: '1.0',
            is_active: false
          }
        });
      }

      return NextResponse.json(
        { error: 'Missing Telegram initData' },
        { status: 401 }
      );
    }

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

    const backendResponse = await fetch(`${BACKEND_API_URL}/v1/contest/active`, {
      method: 'GET',
      headers: {
        'Authorization': initData,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 }, // Кешируем на 1 минуту
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      // Не логируем ожидаемые ошибки (404, 401, 400)
      const isExpectedError = backendResponse.status === 404 ||
        backendResponse.status === 401 ||
        backendResponse.status === 400;

      if (!isExpectedError) {
        logError('Active contest API error', new Error(`Backend returned ${backendResponse.status}`), {
          page: 'api',
          action: 'getActiveContest',
          endpoint: '/api/contest/active',
          status: backendResponse.status
        });
      }

      // Если эндпоинт не найден (404), это значит активного конкурса нет.
      // Но для отображения таймера нам нужен "будущий" конкурс.
      // Симулируем ответ бэкенда с будущим конкурсом.
      if (backendResponse.status === 404) {
        return NextResponse.json({
          ok: true,
          contest: {
            id: 'upcoming-contest-mock',
            title: 'Розыгрыш призов Outlivion',
            starts_at: '2026-01-20T00:00:00Z',
            ends_at: '2026-01-27T00:00:00Z',
            attribution_window_days: 7,
            rules_version: '1.0',
            is_active: false
          }
        });
      }

      return NextResponse.json(
        { ok: false, contest: null, error: errorData.error || errorData.message || 'Failed to fetch active contest' },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json({
      ok: true,
      contest: data.contest || null,
    });
  } catch (error) {
    // Проверяем, является ли это ошибкой сети или fetch
    const isNetworkError = error instanceof Error && (
      error.message.includes('fetch failed') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ENOTFOUND') ||
      error.message.includes('timeout')
    );

    // Логируем только неожиданные ошибки (не связанные с отсутствием эндпоинтов или сетью)
    if (!isNetworkError) {
      logError('Active contest API error', error, {
        page: 'api',
        action: 'getActiveContest',
        endpoint: '/api/contest/active'
      });
    }

    // Если это ошибка сети, возвращаем понятное сообщение
    if (isNetworkError) {
      return NextResponse.json(
        { ok: false, contest: null, error: 'Network error: Backend unavailable' },
        { status: 503 }
      );
    }

    // Если это ошибка 404 от бэкенда, значит эндпоинт не найден или конкурс не активен
    if (error instanceof Error && error.message.includes('404')) {
      return NextResponse.json(
        { ok: false, contest: null, error: 'No active contest found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { ok: false, contest: null, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}