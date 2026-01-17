import { NextRequest, NextResponse } from 'next/server';
import { proxyGet } from '@/lib/utils/api-proxy';
import { validateApiRequest } from '@/lib/utils/api-validation';

/**
 * API Route для получения статуса пользователя и статистики использования
 * 
 * Проксирует запрос на бэкенд API для получения статистики трафика
 */
export async function GET(request: NextRequest) {
  // Валидируем запрос
  const validationError = validateApiRequest(request, true);
  if (validationError) {
    return validationError;
  }

  try {
    // Параллельно получаем статус и billing
    const [statusResponse, billingResponse] = await Promise.all([
      proxyGet(request, '/v1/user/status', {
        requireAuth: true,
        logContext: {
          page: 'api',
          action: 'getUserStatus',
          endpoint: '/api/user/status',
        },
      }),
      proxyGet(request, '/v1/user/billing', {
        requireAuth: true,
        logContext: {
          page: 'api',
          action: 'getUserBilling',
          endpoint: '/api/user/billing',
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

    // Обрабатываем ответ статуса
    if (statusResponse.ok) {
      const data = await statusResponse.json().catch(() => ({}));
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
      const billingData = await billingResponse.json().catch(() => ({}));
      statusData.usedTraffic = billingData.usedBytes || statusData.usedTraffic;
      statusData.dataLimit = billingData.limitBytes || statusData.dataLimit;
    }

    return NextResponse.json(statusData);
  } catch {
    // Обработка ошибок через proxyGet уже выполнена
    // Если дошли сюда, значит ошибка в обработке ответов
    return NextResponse.json(
      { ok: false, status: 'not_found', expiresAt: null, usedTraffic: 0, dataLimit: 0 },
      { status: 500 }
    );
  }
}

