import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/utils/api-proxy';
import { validateApiRequest } from '@/lib/utils/api-validation';

/**
 * API Route для получения истории начислений рефералов
 * 
 * Проксирует GET запрос на бэкенд API /v1/user/referrals/history
 */
export async function GET(request: NextRequest) {
  // Валидируем запрос
  const validationError = validateApiRequest(request, true);
  if (validationError) {
    return validationError;
  }

  // Проксируем запрос на бэкенд API
  return proxyGet(request, '/v1/user/referrals/history', {
    requireAuth: true,
    logContext: {
      page: 'api',
      action: 'getReferralHistory',
      endpoint: '/api/user/referrals/history',
    },
  });
}
