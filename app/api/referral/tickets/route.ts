import { NextRequest, NextResponse } from 'next/server';
import { validateApiRequest, getValidatedInitData } from '@/lib/utils/api-validation';
import { logError } from '@/lib/utils/logging';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.outlivion.space';

/**
 * API Route для получения истории билетов конкурса
 */
export async function GET(request: NextRequest) {
  try {
    // Валидируем запрос с помощью централизованной утилиты
    const validationError = validateApiRequest(request, true);
    if (validationError) {
      return validationError;
    }

    // Получаем валидированный initData
    const initData = getValidatedInitData(request);
    if (!initData) {
      return NextResponse.json(
        { error: 'Missing Telegram initData' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const contestId = searchParams.get('contest_id');

    if (!contestId) {
      return NextResponse.json(
        { error: 'Missing contest_id parameter' },
        { status: 400 }
      );
    }

    const backendResponse = await fetch(
      `${BACKEND_API_URL}/v1/referral/tickets?contest_id=${contestId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': initData,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      // Не логируем ожидаемые ошибки (404, 401, 400)
      const isExpectedError = backendResponse.status === 404 || 
                              backendResponse.status === 401 || 
                              backendResponse.status === 400;
      
      if (!isExpectedError) {
        logError('Referral tickets API error', new Error(`Backend returned ${backendResponse.status}`), {
          page: 'api',
          action: 'getReferralTickets',
          endpoint: '/api/referral/tickets',
          status: backendResponse.status
        });
      }
      
      return NextResponse.json(
        { ok: false, tickets: [], error: errorData.error || 'Failed to fetch tickets' },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json({
      ok: true,
      tickets: data.tickets || [],
    });
  } catch (error) {
    // Логируем только неожиданные ошибки (не связанные с отсутствием эндпоинтов)
    const isExpectedError = error instanceof Error && (
      error.message.includes('404') ||
      error.message.includes('401') ||
      error.message.includes('fetch failed')
    );
    
    if (!isExpectedError) {
      logError('Referral tickets API error', error, {
        page: 'api',
        action: 'getReferralTickets',
        endpoint: '/api/referral/tickets'
      });
    }
    
    return NextResponse.json(
      { ok: false, tickets: [], error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}