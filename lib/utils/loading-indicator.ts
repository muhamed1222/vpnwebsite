/**
 * Утилиты для унифицированной индикации загрузки
 * Обеспечивает единый подход к отображению состояния загрузки
 */

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

/**
 * Создает начальное состояние загрузки
 */
export function createLoadingState(): LoadingState {
  return {
    isLoading: false,
    error: null,
  };
}

/**
 * Обертка для асинхронных операций с автоматической индикацией загрузки
 */
export async function withLoadingIndicator<T>(
  operation: () => Promise<T>,
  setLoading: (loading: boolean) => void,
  setError?: (error: string | null) => void
): Promise<T | null> {
  try {
    setLoading(true);
    if (setError) {
      setError(null);
    }
    const result = await operation();
    return result;
  } catch (error) {
    if (setError) {
      // Преобразуем техническое сообщение в понятное
      const { getUserFriendlyMessage } = await import('./user-messages');
      const errorMessage = error instanceof Error 
        ? getUserFriendlyMessage(error.message)
        : 'Произошла ошибка при выполнении операции';
      setError(errorMessage);
    }
    return null;
  } finally {
    setLoading(false);
  }
}

/**
 * Проверяет, нужно ли показывать индикацию загрузки
 * Для быстрых операций (< 300ms) индикация не показывается
 */
export function shouldShowLoadingIndicator(
  startTime: number,
  minDelay: number = 300
): boolean {
  return Date.now() - startTime >= minDelay;
}
