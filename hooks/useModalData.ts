/**
 * Хук для загрузки данных при открытии модального окна
 * Устраняет дублирование логики загрузки данных в модалках
 */

import { useEffect, useState, useCallback } from 'react';

interface UseModalDataOptions<T> {
  /** Функция загрузки данных */
  loadData: () => Promise<T>;
  /** Открыто ли модальное окно */
  isOpen: boolean;
  /** Зависимости для перезагрузки данных (например, userId) */
  deps?: unknown[];
  /** Начальное значение данных */
  initialData?: T;
  /** Обработчик ошибок */
  onError?: (error: unknown) => void;
}

/**
 * Хук для загрузки данных при открытии модального окна
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error, reload } = useModalData({
 *   loadData: () => api.getReferralStats(),
 *   isOpen,
 *   deps: [user?.id],
 *   initialData: null,
 * });
 * ```
 */
export function useModalData<T>({
  loadData,
  isOpen,
  deps = [],
  initialData,
  onError,
}: UseModalDataOptions<T>) {
  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await loadData();
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      if (onError) {
        onError(err);
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadData, onError]);

  useEffect(() => {
    if (isOpen) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, load, ...deps]);

  const reload = useCallback(() => {
    return load();
  }, [load]);

  return {
    data,
    isLoading,
    error,
    reload,
  };
}
