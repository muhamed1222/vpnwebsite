import * as Sentry from "@sentry/nextjs";
import { NextRequest } from 'next/server';
import { withApiErrorHandling } from '@/lib/utils/api-handler';

export const dynamic = "force-dynamic";

class SentryExampleAPIError extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = "SentryExampleAPIError";
  }
}

/**
 * GET /api/sentry-example-api
 * Пример API route для тестирования Sentry error monitoring
 * Специально бросает ошибку для демонстрации работы Sentry
 */
export async function GET(request: NextRequest) {
  return withApiErrorHandling(async () => {
    Sentry.logger.info("Sentry example API called");
    throw new SentryExampleAPIError(
      "This error is raised on the backend called by the example page.",
    );
  }, request, {
    page: 'api',
    action: 'sentryExample',
    endpoint: '/api/sentry-example-api',
  });
}
