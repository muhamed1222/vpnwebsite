import { getTelegramInitData } from './telegram';
import { config } from './config';
import { withRetry, withTimeout } from './api-retry';
import { logWarn } from './utils/logging';
import { handleApiError } from './utils/errorHandler';
import { getHttpStatusMessage } from './utils/user-messages';

export interface ApiError {
  error: string;
  status?: number;
}

export class ApiException extends Error {
  constructor(
    public message: string,
    public status: number = 500,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ApiException';
  }
}

/**
 * Базовый метод для выполнения API запросов
 * Автоматически добавляет Telegram initData и обрабатывает ошибки
 */
export const apiFetch = async <T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  let initData = getTelegramInitData();

  // В режиме разработки подставляем mock-данные, если приложение запущено не в Telegram
  if (!initData && process.env.NODE_ENV === 'development') {
    initData = 'query_id=STUB&user=%7B%22id%22%3A12345678%2C%22first_name%22%3A%22Developer%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22dev%22%2C%22language_code%22%3A%22ru%22%7D&auth_date=1623822263&hash=7777777777777777777777777777777777777777777777777777777777777777';
    logWarn('[API] Using MOCK Telegram initData for development', {
      action: 'apiFetch',
      environment: 'development'
    });
  }

  if (!initData) {
    throw new ApiException(
      'Telegram WebApp не инициализирован. Пожалуйста, откройте приложение через Telegram.',
      401
    );
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': initData, // Бэкенд всегда ожидает initData
    ...options.headers,
  };

  try {
    // Выполняем запрос с retry и timeout
    // Если baseUrl пустой (клиент), используем Next.js API роуты для проксирования
    // Если baseUrl указан (сервер), делаем запрос напрямую на бэкенд
    const apiUrl = config.api.baseUrl
      ? `${config.api.baseUrl}/api/${endpoint}`
      : `/api/${endpoint}`;

    const response = await withRetry(async () => {
      return await withTimeout(
        fetch(apiUrl, {
          ...options,
          headers,
        })
      );
    });

    // Проверяем Content-Type для правильной обработки ответа
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    // Парсим ответ только если это JSON, иначе пытаемся получить текст
    let data: unknown = {};
    let errorMessage = '';

    if (isJson) {
      try {
        data = await response.json();
      } catch {
        // Если парсинг JSON не удался, оставляем пустой объект
        data = {};
      }
    } else {
      // Если ответ не JSON (например, HTML страница 404), получаем текст
      try {
        const text = await response.text();
        // Если текст начинается с HTML, это значит, что роут не найден
        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<!doctype')) {
          errorMessage = 'Сервис временно недоступен. Попробуйте позже.';
        } else {
          // Попытка парсить как JSON на всякий случай
          try {
            data = JSON.parse(text);
          } catch {
            errorMessage = text.substring(0, 200) || 'Неизвестная ошибка';
          }
        }
      } catch {
        // Если не удалось прочитать текст, используем стандартное сообщение
      }
    }

    if (!response.ok) {
      // Формируем понятное сообщение об ошибке
      if (!errorMessage && typeof data === 'object' && data !== null) {
        const errorData = data as { error?: string; message?: string };
        const rawError = errorData.error || errorData.message || '';
        // Преобразуем техническое сообщение в понятное
        const { getUserFriendlyMessage } = await import('@/lib/utils/user-messages');
        errorMessage = getUserFriendlyMessage(rawError);
      }

      if (!errorMessage) {
        // Если нет сообщения в ответе, формируем по статусу
        errorMessage = getHttpStatusMessage(response.status);
      }

      throw new ApiException(
        errorMessage,
        response.status
      );
    }

    return data as T;
  } catch (error) {
    // Если это уже наш ApiException, пробрасываем дальше
    if (error instanceof ApiException) {
      throw error;
    }

    // Обработка сетевых ошибок
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new ApiException(
        'Проблема с подключением к интернету. Проверьте соединение и попробуйте снова.',
        0,
        error
      );
    }

    // Обработка ошибок CORS
    if (error instanceof TypeError && error.message.includes('CORS')) {
      throw new ApiException(
        'Ошибка подключения к серверу. Попробуйте позже.',
        0,
        error
      );
    }

    // Неизвестная ошибка - используем централизованный обработчик для получения сообщения
    // НЕ показываем ошибку пользователю здесь, так как это будет сделано в компоненте
    const userMessage = handleApiError(error, {
      action: 'apiFetch',
      endpoint,
    }, {
      showToUser: false, // Не показываем здесь, компонент сам решит когда показывать
      logError: true,
    });

    throw new ApiException(
      userMessage,
      500,
      error
    );
  }
};

export const api = {
  // Получение данных пользователя и подписки
  auth: async () => {
    try {
      const data = await apiFetch<{
        id: number;
        firstName: string;
        subscription: {
          is_active: boolean;
          expires_at: number | null;
          vless_key?: string;
        };
        discount?: {
          percent: number;
          expiresAt?: number;
        } | null;
      }>('me', { method: 'GET' });

      // Преобразуем формат для совместимости с фронтендом
      return {
        user: {
          id: data.id,
          firstName: data.firstName,
          username: undefined,
        },
        subscription: {
          status: data.subscription.is_active && data.subscription.expires_at && data.subscription.expires_at > Date.now()
            ? 'active' as const
            : data.subscription.expires_at && data.subscription.expires_at <= Date.now()
              ? 'expired' as const
              : 'none' as const,
          expiresAt: data.subscription.expires_at ? new Date(data.subscription.expires_at).toISOString().split('T')[0] : undefined,
        },
        discount: data.discount || null,
      };
    } catch (error) {
      // Используем централизованный обработчик ошибок
      handleApiError(error, {
        action: 'auth',
        endpoint: '/api/me',
      });
      throw error;
    }
  },

  // Получение VPN конфигурации
  getUserConfig: async () => {
    // Используем кэширование для конфигурации (TTL: 2 минуты)
    const { cachedFetch } = await import('@/lib/utils/apiCache');
    const configData = await cachedFetch(
      'user_config',
      () => apiFetch<{
        ok: boolean;
        config: string | null;
      }>('user/config', { method: 'GET' }),
      2 * 60 * 1000 // 2 минуты
    );

    return {
      ok: configData.ok || false,
      config: configData.config || '',
    };
  },

  // Получение статуса пользователя и статистики (с кэшированием на 1 минуту)
  getUserStatus: async () => {
    const { cachedFetch } = await import('@/lib/utils/apiCache');
    return cachedFetch(
      'user_status',
      async () => {
        // Параллельно получаем статус и billing
        const [statusData, billing] = await Promise.all([
          apiFetch<{
            ok: boolean;
            status: string;
            expiresAt: number | null;
            usedTraffic: number;
            dataLimit: number;
          }>('user/status', { method: 'GET' }),
          apiFetch<{
            usedBytes: number;
            limitBytes: number | null;
            averagePerDayBytes: number;
            planId: string | null;
            planName: string | null;
            period: {
              start: number | null;
              end: number | null;
            };
          }>('user/billing', { method: 'GET' }).catch(() => ({
            usedBytes: 0,
            limitBytes: null,
            averagePerDayBytes: 0,
            planId: null,
            planName: null,
            period: { start: null, end: null },
          })),
        ]);

        const isActive = statusData.status === 'active';

        return {
          ok: isActive,
          status: isActive ? 'active' as const : 'disabled' as const,
          expiresAt: statusData.expiresAt || null,
          usedTraffic: billing.usedBytes || statusData.usedTraffic || 0,
          dataLimit: billing.limitBytes || statusData.dataLimit || 0,
        };
      },
      1 * 60 * 1000 // 1 минута
    );
  },

  // Получение истории платежей (с кэшированием на 2 минуты)
  getPaymentsHistory: async () => {
    const { cachedFetch } = await import('@/lib/utils/apiCache');
    return cachedFetch(
      'payments_history',
      () => apiFetch<Array<{
        id: string;
        orderId: string;
        amount: number;
        currency: string;
        date: number;
        status: 'success' | 'pending' | 'fail';
        planId: string;
        planName: string;
      }>>('payments/history', { method: 'GET' }),
      2 * 60 * 1000 // 2 минуты
    );
  },

  // Получение тарифов (с кэшированием на 5 минут)
  getTariffs: async () => {
    const { cachedFetch } = await import('@/lib/utils/apiCache');
    return cachedFetch(
      'tariffs',
      () => apiFetch<Array<{
        id: string;
        name: string;
        days: number;
        price_stars: number;
        price_rub?: number;
      }>>('tariffs', { method: 'GET' }),
      5 * 60 * 1000 // 5 минут
    );
  },

  getReferralStats: async () => {
    const { cachedFetch } = await import('@/lib/utils/apiCache');
    return cachedFetch(
      'referral_stats',
      () => apiFetch<{
        totalCount: number;
        trialCount: number;
        premiumCount: number;
        referralCode: string;
      }>('user/referrals', { method: 'GET' }),
      2 * 60 * 1000 // 2 минуты
    );
  },

  // Создание заказа
  createOrder: (planId: string, paymentMethod?: string) => apiFetch<{
    orderId: string;
    status: 'pending';
    paymentUrl: string;
  }>('orders/create', {
    method: 'POST',
    body: JSON.stringify({ planId, paymentMethod })
  }),

  // Проверка статуса оплаты и активация подписки
  checkPaymentSuccess: (orderId: string) => apiFetch<{
    status: 'completed' | 'pending';
    vless_key?: string;
    expires_at?: number;
    message?: string;
  }>('payment/success', {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId })
  }),

  // Автопродление (с кэшированием на 1 минуту)
  getAutorenewal: async () => {
    const { cachedFetch } = await import('@/lib/utils/apiCache');
    return cachedFetch(
      'autorenewal',
      () => apiFetch<{
        enabled: boolean;
      }>('user/autorenewal', { method: 'GET' }),
      60 * 1000 // 1 минута
    );
  },

  updateAutorenewal: (enabled: boolean) => apiFetch<{
    enabled: boolean;
  }>('user/autorenewal', {
    method: 'POST',
    body: JSON.stringify({ enabled })
  }),

  // История начислений рефералов (с кэшированием на 2 минуты)
  getReferralHistory: async () => {
    const { cachedFetch } = await import('@/lib/utils/apiCache');
    return cachedFetch(
      'referral_history',
      () => apiFetch<Array<{
        id: string;
        amount: number;
        currency: string;
        date: number;
        referralId: string;
        status: 'pending' | 'completed' | 'cancelled';
      }>>('user/referrals/history', { method: 'GET' }),
      2 * 60 * 1000 // 2 минуты
    );
  },

  // Конкурсы
  getActiveContest: async () => {
    const { cachedFetch } = await import('@/lib/utils/apiCache');
    return cachedFetch(
      'active_contest',
      () => apiFetch<{
        ok: boolean;
        contest: {
          id: string;
          title: string;
          starts_at: string;
          ends_at: string;
          attribution_window_days: number;
          rules_version: string;
          is_active: boolean;
        } | null;
      }>('contest/active', { method: 'GET' }),
      60 * 1000 // 1 минута
    );
  },

  getContestSummary: async (contestId: string) => {
    const { cachedFetch } = await import('@/lib/utils/apiCache');
    return cachedFetch(
      `contest_summary_${contestId}`,
      () => apiFetch<{
        ok: boolean;
        summary: {
          contest: {
            id: string;
            title: string;
            starts_at: string;
            ends_at: string;
            attribution_window_days: number;
            rules_version: string;
            is_active: boolean;
          };
          ref_link: string;
          tickets_total: number;
          invited_total: number;
          qualified_total: number;
          pending_total: number;
        };
      }>(`referral/summary?contest_id=${contestId}`, { method: 'GET' }),
      1 * 60 * 1000 // 1 минута
    );
  },

  getContestFriends: async (contestId: string, limit: number = 50) => {
    const { cachedFetch } = await import('@/lib/utils/apiCache');
    return cachedFetch(
      `contest_friends_${contestId}_${limit}`,
      () => apiFetch<{
        ok: boolean;
        friends: Array<{
          id: string;
          name: string | null;
          tg_username: string | null;
          status: 'bound' | 'qualified' | 'blocked' | 'not_qualified';
          status_reason: string | null;
          tickets_from_friend_total: number;
          bound_at: string;
        }>;
      }>(`referral/friends?contest_id=${contestId}&limit=${limit}`, { method: 'GET' }),
      1 * 60 * 1000 // 1 минута
    );
  },

  getContestTickets: async (contestId: string) => {
    const { cachedFetch } = await import('@/lib/utils/apiCache');
    return cachedFetch(
      `contest_tickets_${contestId}`,
      () => apiFetch<{
        ok: boolean;
        tickets: Array<{
          id: string;
          created_at: string;
          delta: number;
          label: string;
          invitee_name: string | null;
        }>;
      }>(`referral/tickets?contest_id=${contestId}`, { method: 'GET' }),
      1 * 60 * 1000 // 1 минута
    );
  },
};

