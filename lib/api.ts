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
    throw new ApiException(
      'Telegram WebApp not initialized',
      401
    );
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-Telegram-Init-Data': initData,
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
  auth: () => apiFetch<{
    user: {
      id: number;
      firstName: string;
      username?: string;
    };
    subscription: {
      status: 'active' | 'expired' | 'none';
      expiresAt?: string;
    };
  }>('tg/auth', { method: 'POST' }),
  
  getUserConfig: () => apiFetch<{
    ok: boolean;
    config: string;
  }>('user/config', { method: 'GET' }),
  
  getUserStatus: () => apiFetch<{
    ok: boolean;
    status: 'active' | 'disabled' | 'not_found' | 'on_hold';
    expiresAt: number | null;
    usedTraffic: number;
    dataLimit: number;
  }>('user/status', { method: 'GET' }),
};

