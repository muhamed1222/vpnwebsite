import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/utils/api-proxy';
import { validateApiRequest } from '@/lib/utils/api-validation';

/**
 * API Route для получения статистики рефералов
 * 
 * Проксирует GET запрос на бэкенд API /v1/user/referrals
 */
export async function GET(request: NextRequest) {
  // Валидируем запрос
  const validationError = validateApiRequest(request, true);
  if (validationError) {
    return validationError;
  }

  // Проксируем запрос на бэкенд API
  return proxyGet(request, '/v1/user/referrals', {
    requireAuth: true,
    logContext: {
      page: 'api',
      action: 'getReferralStats',
      endpoint: '/api/user/referrals',
    },
  });
}

