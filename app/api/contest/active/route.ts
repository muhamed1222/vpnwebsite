import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logError } from '@/lib/utils/logging';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.outlivion.space';
// ADMIN_API_KEY может быть названа как ADM (сокращение) или ADMIN_API_KEY в Vercel
// Поддерживаем оба варианта для совместимости
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || process.env.ADM || process.env.NEXT_PUBLIC_ADMIN_API_KEY || '';

/**
 * API Route для получения активного конкурса
 */
export async function GET(request: NextRequest) {
  try {
    // Проверяем админскую сессию (для доступа без Telegram)
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin_session');

    const initData = request.headers.get('X-Telegram-Init-Data') ||
      request.headers.get('Authorization');

    // Если есть админская сессия, пропускаем проверку Telegram
    const hasAdminSession = adminSession && adminSession.value;

    if (!initData && !hasAdminSession) {
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

    // Проверяем Telegram авторизацию только если нет админской сессии и есть initData
    if (!hasAdminSession && initData) {
      // Используем централизованную валидацию
      const { validateRequestInitData } = await import('@/lib/utils/api-validation');
      const validation = validateRequestInitData(request, true);
      
      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.error || 'Invalid Telegram initData signature' },
          { status: validation.status || 401 }
        );
      }
    }

    // Формируем заголовки для запроса к бэкенду
    const backendHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Если есть админская сессия, используем ADMIN_API_KEY
    // Иначе отправляем Telegram initData
    if (hasAdminSession && ADMIN_API_KEY) {
      backendHeaders['x-admin-api-key'] = ADMIN_API_KEY;
    } else if (initData) {
      backendHeaders['Authorization'] = initData;
    } else if (!hasAdminSession) {
      // Нет ни сессии, ни initData - возвращаем ошибку
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const backendResponse = await fetch(`${BACKEND_API_URL}/v1/contest/active`, {
      method: 'GET',
      headers: backendHeaders,
      cache: hasAdminSession ? 'no-store' : 'default', // Для админов не кешируем
      next: hasAdminSession ? undefined : { revalidate: 60 }, // Кешируем только для обычных пользователей
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

      // Если эндпоинт не найден (404), это значит активного конкурса нет по датам.
      // Для админов: получаем конкурс напрямую из БД (без проверки дат)
      if (backendResponse.status === 404) {
        if (hasAdminSession && ADMIN_API_KEY) {
          // Для админов пробуем получить конкурс напрямую через другой endpoint
          // или возвращаем информацию о том, что конкурс есть, но еще не начался
          // Пока возвращаем ошибку, но с понятным сообщением
          return NextResponse.json(
            { 
              ok: false, 
              contest: null, 
              error: 'No active contest found (contest may not have started yet)' 
            },
            { status: 404 }
          );
        }
        // Для обычных пользователей возвращаем mock для отображения таймера
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