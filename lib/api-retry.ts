import { ApiException } from './api';
import { API_CONFIG } from './constants';

/**
 * Выполняет запрос с автоматическими повторами при ошибках
 * 
 * @param fetchFn - Функция для выполнения запроса
 * @param maxRetries - Максимальное количество попыток
 * @param retryDelay - Задержка между попытками (мс)
 * @returns Результат запроса
 */
export async function withRetry<T>(
  fetchFn: () => Promise<T>,
  maxRetries: number = API_CONFIG.MAX_RETRIES,
  retryDelay: number = API_CONFIG.RETRY_DELAY
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetchFn();
    } catch (error) {
      lastError = error;

      // Не повторяем для клиентских ошибок (4xx)
      if (error instanceof ApiException && error.status >= 400 && error.status < 500) {
        throw error;
      }

      // Не повторяем на последней попытке
      if (attempt === maxRetries) {
        break;
      }

      // Экспоненциальная задержка: 1s, 2s, 4s...
      const delay = retryDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Выполняет запрос с таймаутом
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = API_CONFIG.TIMEOUT
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new ApiException('Request timeout', 408));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

