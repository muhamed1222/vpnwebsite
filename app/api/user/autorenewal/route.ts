import { NextRequest, NextResponse } from 'next/server';
import { validateApiRequest, getValidatedInitData } from '@/lib/utils/api-validation';
import { logError } from '@/lib/utils/logging';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.outlivion.space';

/**
 * API Route для получения статуса автопродления
 * GET /api/user/autorenewal
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

    // Проксируем запрос на бэкенд API
    const backendResponse = await fetch(`${BACKEND_API_URL}/v1/user/autorenewal`, {
      method: 'GET',
      headers: {
        'Authorization': initData,
        'Content-Type': 'application/json',
      },
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Ошибка загрузки статуса автопродления' },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    logError('Autorenewal GET API error', error, {
      page: 'api',
      action: 'getAutorenewal',
      endpoint: '/api/user/autorenewal'
    });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера. Попробуйте позже.' },
      { status: 500 }
    );
  }
}

/**
 * API Route для обновления статуса автопродления
 * POST /api/user/autorenewal
 */
export async function POST(request: NextRequest) {
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

    // Получаем тело запроса
    const body = await request.json();

    // Проксируем запрос на бэкенд API
    const backendResponse = await fetch(`${BACKEND_API_URL}/v1/user/autorenewal`, {
      method: 'POST',
      headers: {
        'Authorization': initData,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Ошибка обновления автопродления' },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    logError('Autorenewal POST API error', error, {
      page: 'api',
      action: 'updateAutorenewal',
      endpoint: '/api/user/autorenewal'
    });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера. Попробуйте позже.' },
      { status: 500 }
    );
  }
}
