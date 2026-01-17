import { NextRequest, NextResponse } from 'next/server';
import { validateApiRequest, getValidatedInitData } from '@/lib/utils/api-validation';
import { logError } from '@/lib/utils/logging';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.outlivion.space';

/**
 * API Route для получения статуса пользователя и статистики использования
 * 
 * Проксирует запрос на бэкенд API для получения статистики трафика
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

    // Параллельно получаем статус и billing с initData в Authorization header
    const [statusResponse, billingResponse] = await Promise.all([
      fetch(`${BACKEND_API_URL}/v1/user/status`, {
        method: 'GET',
        headers: {
          'Authorization': initData, // initData в Authorization header
          'Content-Type': 'application/json',
        },
      }),
      fetch(`${BACKEND_API_URL}/v1/user/billing`, {
        method: 'GET',
        headers: {
          'Authorization': initData, // initData в Authorization header
          'Content-Type': 'application/json',
        },
      }).catch(() => null), // Если роут не существует, игнорируем
    ]);

    let statusData: {
      ok: boolean;
      status: 'active' | 'disabled' | 'not_found';
      expiresAt: number | null;
      usedTraffic: number;
      dataLimit: number;
    } = {
      ok: false,
      status: 'not_found',
      expiresAt: null,
      usedTraffic: 0,
      dataLimit: 0,
    };

    if (statusResponse.ok) {
      const data = await statusResponse.json();
      statusData = {
        ok: data.ok || false,
        status: data.status === 'active' ? 'active' : 'disabled',
        expiresAt: data.expiresAt ? (typeof data.expiresAt === 'number' ? data.expiresAt : new Date(data.expiresAt).getTime()) : null,
        usedTraffic: data.usedTraffic || 0,
        dataLimit: data.dataLimit || 0,
      };
    }

    // Если есть billing данные, используем их
    if (billingResponse && billingResponse.ok) {
      const billingData = await billingResponse.json();
      statusData.usedTraffic = billingData.usedBytes || statusData.usedTraffic;
      statusData.dataLimit = billingData.limitBytes || statusData.dataLimit;
    }

    return NextResponse.json(statusData);
  } catch (error) {
    logError('Status API error', error, {
      page: 'api',
      action: 'getUserStatus',
      endpoint: '/api/user/status'
    });
    
    // Обработка сетевых ошибок
    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return NextResponse.json(
          { error: 'Проблема с подключением к серверу. Проверьте интернет-соединение.' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

