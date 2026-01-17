import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { proxyGet } from '@/lib/utils/api-proxy';
import { validateApiRequest } from '@/lib/utils/api-validation';

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || process.env.ADM || process.env.NEXT_PUBLIC_ADMIN_API_KEY || '';

/**
 * API Route для получения списка участников конкурса (админский endpoint)
 */
export async function GET(request: NextRequest) {
  // Логируем только безопасную информацию (без чувствительных данных)
  if (process.env.NODE_ENV === 'development') {
    console.log('[Admin API Debug] Env check:', {
      hasAdminApiKey: !!ADMIN_API_KEY,
      hasADM: !!process.env.ADM,
      hasADMIN_API_KEY: !!process.env.ADMIN_API_KEY,
      hasNEXT_PUBLIC_ADMIN_API_KEY: !!process.env.NEXT_PUBLIC_ADMIN_API_KEY,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      adminApiKeyLength: ADMIN_API_KEY ? ADMIN_API_KEY.length : 0,
    });
  }

  try {
    // Проверяем админскую сессию (приоритет) или Telegram авторизацию
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin_session');
    const useAdminSession = adminSession && adminSession.value;

    const initData = request.headers.get('X-Telegram-Init-Data') ||
      request.headers.get('Authorization');

    // Если нет ни сессии, ни Telegram - нужна авторизация
    if (!useAdminSession && !initData) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Проверяем Telegram авторизацию только если нет админской сессии
    if (!useAdminSession && initData) {
      const validationError = validateApiRequest(request, true);
      if (validationError) {
        return validationError;
      }
    }

    // Получаем contest_id из query параметров
    const { searchParams } = new URL(request.url);
    const contestId = searchParams.get('contest_id');

    if (!contestId) {
      return NextResponse.json(
        { error: 'Missing contest_id parameter' },
        { status: 400 }
      );
    }

    // Предупреждение, если ADMIN_API_KEY не установлен
    if (useAdminSession && !ADMIN_API_KEY) {
      console.warn('[Admin API] ADMIN_API_KEY not configured, request may fail');
    }

    // Используем proxyGet с поддержкой админского API ключа
    const response = await proxyGet(request, '/v1/admin/contest/participants', {
      requireAuth: false, // Уже проверили выше
      adminApiKey: useAdminSession && ADMIN_API_KEY ? ADMIN_API_KEY : undefined,
      queryParams: { contest_id: contestId },
      logContext: {
        page: 'api',
        action: 'getContestParticipants',
        endpoint: '/api/admin/contest/participants',
      },
    });

    // Обрабатываем специальные статусы
    if (response.status === 403) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Если успешный ответ, форматируем данные
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        ok: true,
        tickets: data.tickets || [],
      });
    }

    // Остальные ошибки возвращаем как есть
    return response;
  } catch {
    return NextResponse.json(
      { ok: false, participants: [], error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
