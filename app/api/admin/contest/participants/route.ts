import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateTelegramInitData } from '@/lib/telegram-validation';
import { serverConfig } from '@/lib/config';
import { logError } from '@/lib/utils/logging';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.outlivion.space';
// ADMIN_API_KEY может быть как без префикса (для server-side), так и с NEXT_PUBLIC_ (для client-side)
// На Vercel обычно используется без префикса для API routes
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || process.env.NEXT_PUBLIC_ADMIN_API_KEY || '';

/**
 * API Route для получения списка участников конкурса (админский endpoint)
 */
export async function GET(request: NextRequest) {
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
    if (!useAdminSession && initData && serverConfig.telegram.botToken) {
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
      } else {
        // Если ADMIN_API_KEY не установлен, логируем предупреждение
        console.warn('[Admin API] ADMIN_API_KEY not configured, request may fail');
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
      
      if (backendResponse.status === 403) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Admin access required' },
          { status: 403 }
        );
      }
      
      logError('Admin contest participants API error', new Error(`Backend returned ${backendResponse.status}`), {
        page: 'api',
        action: 'getContestParticipants',
        endpoint: '/api/admin/contest/participants',
        status: backendResponse.status
      });
      
      return NextResponse.json(
        { ok: false, participants: [], error: errorData.error || 'Failed to fetch participants' },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json({
      ok: true,
      participants: data.participants || [],
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
