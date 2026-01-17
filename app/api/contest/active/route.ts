import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { proxyGet } from '@/lib/utils/api-proxy';
import { validateApiRequest } from '@/lib/utils/api-validation';
import { CACHE_CONFIG } from '@/lib/constants';

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || process.env.ADM || process.env.NEXT_PUBLIC_ADMIN_API_KEY || '';

/**
 * API Route для получения активного конкурса
 */
export async function GET(request: NextRequest) {
  try {
    // Проверяем админскую сессию (для доступа без Telegram)
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin_session');
    const hasAdminSession = adminSession && adminSession.value;

    const initData = request.headers.get('X-Telegram-Init-Data') ||
      request.headers.get('Authorization');

    // Если нет ни сессии, ни initData
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
      const validationError = validateApiRequest(request, true);
      if (validationError) {
        return validationError;
      }
    }

    // Используем proxyGet с поддержкой админского API ключа
    const response = await proxyGet(request, '/v1/contest/active', {
      requireAuth: false, // Уже проверили выше
      adminApiKey: hasAdminSession && ADMIN_API_KEY ? ADMIN_API_KEY : undefined,
      noCache: !!hasAdminSession, // Для админов не кэшируем
      revalidate: hasAdminSession ? undefined : CACHE_CONFIG.CONTEST_ACTIVE, // Кэшируем только для обычных пользователей
      logContext: {
        page: 'api',
        action: 'getActiveContest',
        endpoint: '/api/contest/active',
      },
    });

    // Если ответ 404, обрабатываем специально
    if (response.status === 404) {
      // Для админов возвращаем понятное сообщение
      if (hasAdminSession) {
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

    // Если успешный ответ, форматируем данные
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        ok: true,
        contest: data.contest || null,
      });
    }

    // Остальные ошибки возвращаем как есть
    return response;
  } catch (error) {
    // Проверяем, является ли это ошибкой сети или fetch
    const isNetworkError = error instanceof Error && (
      error.message.includes('fetch failed') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ENOTFOUND') ||
      error.message.includes('timeout')
    );

    // Если это ошибка сети, возвращаем понятное сообщение
    if (isNetworkError) {
      return NextResponse.json(
        { ok: false, contest: null, error: 'Сервис временно недоступен. Попробуйте позже.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { ok: false, contest: null, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
