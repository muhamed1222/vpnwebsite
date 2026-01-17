/**
 * Утилита для работы с кэшем в localStorage
 * Поддерживает TTL (Time To Live) для автоматического истечения кэша
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl?: number; // В миллисекундах
}

/**
 * Проверяет, не истек ли кэш
 */
function isExpired<T>(entry: CacheEntry<T> | null): boolean {
  if (!entry) return true;
  if (!entry.ttl) return false; // Если TTL не указан, кэш не истекает
  return Date.now() - entry.timestamp > entry.ttl;
}

/**
 * Получает значение из кэша
 */
export function getCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const entry: CacheEntry<T> = JSON.parse(item);
    
    if (isExpired(entry)) {
      // Удаляем истекший кэш
      localStorage.removeItem(key);
      return null;
    }

    return entry.data;
  } catch {
    // Если ошибка парсинга, удаляем невалидный кэш
    localStorage.removeItem(key);
    return null;
  }
}

/**
 * Сохраняет значение в кэш
 */
export function setCache<T>(key: string, data: T, ttl?: number): void {
  if (typeof window === 'undefined') return;

  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    ttl,
  };

  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Если localStorage переполнен, пытаемся очистить старые записи
    try {
      // Удаляем первую запись (FIFO)
      const firstKey = localStorage.key(0);
      if (firstKey) {
        localStorage.removeItem(firstKey);
        // Пробуем снова
        localStorage.setItem(key, JSON.stringify(entry));
      }
    } catch {
      // Если не удалось, просто игнорируем ошибку
    }
  }
}

/**
 * Удаляет значение из кэша
 */
export function removeCache(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}

/**
 * Очищает весь кэш
 */
export function clearCache(): void {
  if (typeof window === 'undefined') return;
  localStorage.clear();
}

/**
 * Получает значение из кэша или выполняет функцию и кэширует результат
 */
export async function getOrSetCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cached = getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  const data = await fetcher();
  setCache(key, data, ttl);
  return data;
}
