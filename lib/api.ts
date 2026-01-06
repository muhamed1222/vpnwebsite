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
  const initData = getTelegramInitData();

  if (!initData) {
    // Для некоторых эндпоинтов (например, тарифы) можно работать без авторизации
    // Но для безопасности лучше требовать initData
    throw new ApiException(
      'Telegram WebApp not initialized',
      401
    );
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': initData, // Бэкенд ожидает initData в заголовке Authorization
    ...options.headers,
  };

  try {
    // Выполняем запрос с retry и timeout
    const response = await withRetry(async () => {
      return await withTimeout(
        fetch(`${config.api.baseUrl}/api/${endpoint}`, {
          ...options,
          headers,
        })
      );
    });

    // Парсим ответ даже если статус не OK
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new ApiException(
        data.error || `API error: ${response.statusText}`,
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
        'Network error. Please check your connection.',
        0,
        error
      );
    }

    // Неизвестная ошибка
    throw new ApiException(
      'An unexpected error occurred',
      500,
      error
    );
  }
};

export const api = {
  // Получение данных пользователя и подписки
  auth: async () => {
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
  },
  
  // Получение VPN конфигурации
  getUserConfig: async () => {
    const userData = await apiFetch<{
      id: number;
      firstName: string;
      subscription: {
        is_active: boolean;
        expires_at: number | null;
        vless_key?: string;
      };
    }>('me', { method: 'GET' });
    
    const isActive = userData.subscription.is_active && 
                     userData.subscription.expires_at && 
                     userData.subscription.expires_at > Date.now();
    
    return {
      ok: isActive && !!userData.subscription.vless_key,
      config: userData.subscription.vless_key || '',
    };
  },
  
  // Получение статуса пользователя и статистики
  getUserStatus: async () => {
    // Параллельно получаем данные пользователя и статистику
    const [userData, billing] = await Promise.all([
      apiFetch<{
        id: number;
        firstName: string;
        subscription: {
          is_active: boolean;
          expires_at: number | null;
        };
      }>('me', { method: 'GET' }),
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
      }>('billing', { method: 'GET' }).catch(() => ({
        usedBytes: 0,
        limitBytes: null,
        averagePerDayBytes: 0,
        planId: null,
        planName: null,
        period: { start: null, end: null },
      })),
    ]);
    
    const isActive = userData.subscription.is_active && 
                     userData.subscription.expires_at && 
                     userData.subscription.expires_at > Date.now();
    
    return {
      ok: isActive,
      status: isActive ? 'active' as const : 'disabled' as const,
      expiresAt: userData.subscription.expires_at || null,
      usedTraffic: billing.usedBytes || 0,
      dataLimit: billing.limitBytes || 0,
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
  }>>('tariffs', { method: 'GET' }),
};

