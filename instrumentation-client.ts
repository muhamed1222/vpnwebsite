// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://55c98f9699d0367ee4e349e9ed1e1acd@o4510478994243584.ingest.de.sentry.io/4510681956745296",

  // Add optional integrations for additional features
  integrations: [
    Sentry.replayIntegration({
      // Настройка сериализации для избежания проблем с Promise-объектами
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // Фильтруем предупреждения Next.js о params и searchParams Promise
  beforeSend(event) {
    // Игнорируем предупреждения о params/searchParams Promise в Next.js 16
    if (event.message) {
      let message = '';
      if (typeof event.message === 'string') {
        message = event.message;
      } else if (typeof event.message === 'object' && event.message !== null && 'formatted' in event.message) {
        message = String((event.message as { formatted?: string }).formatted || '');
      }
      if (message.includes('params are being enumerated') || 
          message.includes('params is a Promise') ||
          message.includes('searchParams') && message.includes('Promise') ||
          message.includes('The keys of') && message.includes('were accessed directly') ||
          message.includes('must be unwrapped with React.use()')) {
        return null; // Не отправляем это событие в Sentry
      }
    }
    
    // Фильтруем ошибки, связанные с перечислением params/searchParams
    if (event.exception) {
      const exception = event.exception.values?.[0];
      if (exception?.value?.includes('params are being enumerated') ||
          exception?.value?.includes('params is a Promise') ||
          exception?.value?.includes('searchParams') && exception?.value?.includes('Promise') ||
          exception?.value?.includes('The keys of') && exception?.value?.includes('were accessed directly')) {
        return null;
      }
    }

    return event;
  },

  // Настройка сериализации для избежания проблем с Promise-объектами
  normalizeDepth: 3, // Ограничиваем глубину сериализации
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
