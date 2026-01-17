import { NextRequest, NextResponse } from 'next/server';
import { validateApiRequest, getValidatedInitData } from '@/lib/utils/api-validation';
import { logError } from '@/lib/utils/logging';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.outlivion.space';

/**
 * API Route для получения истории платежей
 * 
 * Проксирует GET запрос на бэкенд API /api/payments/history
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

    // Проксируем запрос на бэкенд API с initData в Authorization header
    const backendUrl = `${BACKEND_API_URL}/v1/payments/history`;
    
    logError('Payments history request', null, {
      page: 'api',
      action: 'getPaymentsHistory',
      endpoint: '/api/payments/history',
      backendUrl,
      hasInitData: !!initData,
    });

    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': initData, // initData в Authorization header
        'Content-Type': 'application/json',
      },
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.message || 'Ошибка загрузки истории платежей';
      
      logError('Payments history API error', new Error(errorMessage), {
        page: 'api',
        action: 'getPaymentsHistory',
        endpoint: '/api/payments/history',
        status: backendResponse.status,
        error: errorMessage,
      });
      
      return NextResponse.json(
        { error: errorMessage },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    
    logError('Payments history success', null, {
      page: 'api',
      action: 'getPaymentsHistory',
      endpoint: '/api/payments/history',
      paymentsCount: Array.isArray(data) ? data.length : 0,
    });
    
    return NextResponse.json(data);
  } catch (error) {
    logError('Payments history API error', error, {
      page: 'api',
      action: 'getPaymentsHistory',
      endpoint: '/api/payments/history'
    });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера. Попробуйте позже.' },
      { status: 500 }
    );
  }
}

