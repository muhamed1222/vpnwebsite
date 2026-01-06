/**
 * Аналитика событий приложения
 * Централизованная система для отслеживания пользовательских действий
 */

export type AnalyticsEvent =
  | { type: 'page_view'; page: string }
  | { type: 'button_click'; button: string; page?: string }
  | { type: 'modal_open'; modal: string }
  | { type: 'modal_close'; modal: string }
  | { type: 'purchase_start'; plan: string; price: number }
  | { type: 'purchase_complete'; plan: string; price: number }
  | { type: 'subscription_status_change'; status: string }
  | { type: 'error'; error: string; context?: string }
  | { type: 'api_call'; endpoint: string; success: boolean }
  | { type: 'link_click'; url: string; type: 'external' | 'internal' };

/**
 * Отправляет событие аналитики
 * В production здесь должна быть интеграция с реальной системой аналитики
 */
export function trackEvent(event: AnalyticsEvent): void {
  // В development режиме просто логируем
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', event);
    return;
  }

  // TODO: Интеграция с реальной аналитикой (например, Google Analytics, Yandex.Metrica, Amplitude)
  // Пример:
  // if (window.gtag) {
  //   window.gtag('event', event.type, {
  //     ...event,
  //   });
  // }

  // Для Telegram Mini Apps можно использовать встроенную аналитику
  // или отправлять события на свой бэкенд
}

/**
 * Хелперы для частых событий
 */
export const analytics = {
  pageView: (page: string) => trackEvent({ type: 'page_view', page }),
  
  buttonClick: (button: string, page?: string) => 
    trackEvent({ type: 'button_click', button, page }),
  
  modalOpen: (modal: string) => 
    trackEvent({ type: 'modal_open', modal }),
  
  modalClose: (modal: string) => 
    trackEvent({ type: 'modal_close', modal }),
  
  purchaseStart: (plan: string, price: number) => 
    trackEvent({ type: 'purchase_start', plan, price }),
  
  purchaseComplete: (plan: string, price: number) => 
    trackEvent({ type: 'purchase_complete', plan, price }),
  
  error: (error: string, context?: string) => 
    trackEvent({ type: 'error', error, context }),
  
  apiCall: (endpoint: string, success: boolean) => 
    trackEvent({ type: 'api_call', endpoint, success }),
  
  linkClick: (url: string, type: 'external' | 'internal' = 'external') => 
    trackEvent({ type: 'link_click', url, type }),
};

