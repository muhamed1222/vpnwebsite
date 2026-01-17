import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logError } from '@/lib/utils/logging';
import { safeStringify } from '@/lib/utils/sanitize';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.outlivion.space';
// ADMIN_API_KEY может быть как без префикса (для server-side), так и с NEXT_PUBLIC_ (для client-side)
// На Vercel может быть названа как ADM (сокращение) или ADMIN_API_KEY
// Поддерживаем оба варианта для совместимости
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
      // НЕ логируем даже первые символы API ключа - это чувствительные данные
    });
  }

  try {
    // Проверяем админскую сессию (приоритет) или Telegram авторизацию
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin_session');

    const initData = request.headers.get('X-Telegram-Init-Data') ||
      request.headers.get('Authorization');

    const useAdminSession = adminSession && adminSession.value;

    // Если есть админская сессия, используем её вместо Telegram
    if (!useAdminSession && !initData) {
      // Нет ни сессии, ни Telegram - нужна авторизация
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Проверяем Telegram авторизацию только если нет админской сессии
    if (!useAdminSession && initData) {
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

    const { searchParams } = new URL(request.url);
    const contestId = searchParams.get('contest_id');

    if (!contestId) {
      return NextResponse.json(
        { error: 'Missing contest_id parameter' },
        { status: 400 }
      );
    }

    // Формируем заголовки для запроса к бэкенду
    const backendHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Если используем админскую сессию, отправляем admin API key (если настроен)
    if (useAdminSession) {
      if (ADMIN_API_KEY) {
        backendHeaders['x-admin-api-key'] = ADMIN_API_KEY;
        console.log('[Admin API] Using admin session with API key');
      } else {
        // Если ADMIN_API_KEY не установлен, логируем предупреждение
        console.warn('[Admin API] ADMIN_API_KEY not configured, request may fail');
        logError('ADMIN_API_KEY missing', new Error('ADMIN_API_KEY not set'), {
          page: 'api',
          action: 'getContestParticipants',
          hasAdminSession: !!useAdminSession
        });
      }
    } else if (initData) {
      // Иначе отправляем Telegram initData
      backendHeaders['Authorization'] = initData;
    } else {
      // Нет ни сессии, ни initData
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const backendResponse = await fetch(
      `${BACKEND_API_URL}/v1/admin/contest/participants?contest_id=${contestId}`,
      {
        method: 'GET',
        headers: backendHeaders,
      }
    );

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));

      // Логируем детали для отладки (без чувствительных данных)
      if (process.env.NODE_ENV === 'development') {
        console.error('[Admin API] Backend error:', {
          status: backendResponse.status,
          error: errorData.error || errorData.message || 'Unknown error',
          hasAdminSession: !!useAdminSession,
          hasAdminApiKey: !!ADMIN_API_KEY,
          contestId
        });
      }

      if (backendResponse.status === 403) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Admin access required' },
          { status: 403 }
        );
      }

      if (backendResponse.status === 401) {
        // Используем safeStringify для предотвращения утечки чувствительных данных
        const safeErrorData = safeStringify(errorData);
        logError('Admin contest participants API 401', new Error(`Unauthorized: ${safeErrorData}`), {
          page: 'api',
          action: 'getContestParticipants',
          endpoint: '/api/admin/contest/participants',
          status: backendResponse.status,
          hasAdminSession: !!useAdminSession,
          hasAdminApiKey: !!ADMIN_API_KEY
        });
      } else {
        logError('Admin contest participants API error', new Error(`Backend returned ${backendResponse.status}`), {
          page: 'api',
          action: 'getContestParticipants',
          endpoint: '/api/admin/contest/participants',
          status: backendResponse.status
        });
      }

      return NextResponse.json(
        { ok: false, participants: [], error: errorData.error || 'Failed to fetch participants' },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json({
      ok: true,
      tickets: data.tickets || [],
    });
  } catch (error) {
    logError('Admin contest participants API error', error, {
      page: 'api',
      action: 'getContestParticipants',
      endpoint: '/api/admin/contest/participants'
    });

    return NextResponse.json(
      { ok: false, participants: [], error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
