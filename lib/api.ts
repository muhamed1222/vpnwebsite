import { getTelegramInitData } from './telegram';
import { config } from './config';
import { withRetry, withTimeout } from './api-retry';

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
    console.warn('[API] Using MOCK Telegram initData for development');
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

    // Парсим ответ даже если статус не OK
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Формируем понятное сообщение об ошибке
      let errorMessage = data.error || data.message;
      
      if (!errorMessage) {
        // Если нет сообщения в ответе, формируем по статусу
        switch (response.status) {
          case 401:
            errorMessage = 'Ошибка авторизации. Пожалуйста, перезапустите приложение.';
            break;
          case 403:
            errorMessage = 'Доступ запрещен. Проверьте права доступа.';
            break;
          case 404:
            errorMessage = 'Запрашиваемый ресурс не найден.';
            break;
          case 500:
            errorMessage = 'Ошибка сервера. Попробуйте позже.';
            break;
          case 503:
            errorMessage = 'Сервис временно недоступен. Попробуйте позже.';
            break;
          default:
            errorMessage = `Ошибка сервера (${response.status}). Попробуйте позже.`;
        }
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
        'Проблема с подключением к серверу. Проверьте интернет-соединение.',
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

    // Неизвестная ошибка
    throw new ApiException(
      'Произошла непредвиденная ошибка. Попробуйте перезагрузить приложение.',
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
      };
    } catch (error) {
      // Логируем ошибку для отладки
      console.error('[API auth] Error:', error);
      throw error;
    }
  },
  
  // Получение VPN конфигурации
  getUserConfig: async () => {
    // Используем прямой роут /user/config вместо /me
    const configData = await apiFetch<{
      ok: boolean;
      config: string | null;
    }>('user/config', { method: 'GET' });
    
    return {
      ok: configData.ok || false,
      config: configData.config || '',
    };
  },
  
  // Получение статуса пользователя и статистики
  getUserStatus: async () => {
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
  
  // Получение истории платежей
  getPaymentsHistory: () => apiFetch<Array<{
    id: string;
    orderId: string;
    amount: number;
    currency: string;
    date: number;
    status: 'success' | 'pending' | 'fail';
    planId: string;
    planName: string;
  }>>('payments/history', { method: 'GET' }),
  
  // Получение тарифов
  getTariffs: () => apiFetch<Array<{
    id: string;
    name: string;
    days: number;
    price_stars: number;
    price_rub?: number;
  }>>('tariffs', { method: 'GET' }),

  getReferralStats: () => apiFetch<{
    totalCount: number;
    trialCount: number;
    premiumCount: number;
    referralCode: string;
  }>('user/referrals', { method: 'GET' }),

  // Создание заказа
  createOrder: (planId: string) => apiFetch<{
    orderId: string;
    status: 'pending';
    paymentUrl: string;
  }>('orders/create', { 
    method: 'POST',
    body: JSON.stringify({ planId })
  }),
};

