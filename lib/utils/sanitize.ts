/**
 * Утилиты для санитизации чувствительных данных перед логированием
 * Предотвращает утечку паролей, токенов, API ключей и других чувствительных данных
 */

/**
 * Список ключей, которые содержат чувствительные данные
 * Эти ключи будут заменены на [REDACTED] при логировании
 */
const SENSITIVE_KEYS = [
  'password',
  'passwd',
  'pwd',
  'token',
  'apiKey',
  'api_key',
  'apikey',
  'secret',
  'secretKey',
  'secret_key',
  'authorization',
  'auth',
  'initData',
  'init_data',
  'telegramInitData',
  'telegram_init_data',
  'botToken',
  'bot_token',
  'adminApiKey',
  'admin_api_key',
  'adminApiKeyValue',
  'admin_api_key_value',
  'session',
  'sessionToken',
  'session_token',
  'cookie',
  'cookies',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'jwt',
  'jwtToken',
  'jwt_token',
] as const;

/**
 * Проверяет, является ли ключ чувствительным
 */
function isSensitiveKey(key: string): boolean {
  const lowerKey = key.toLowerCase();
  return SENSITIVE_KEYS.some(sensitiveKey => 
    lowerKey.includes(sensitiveKey.toLowerCase())
  );
}

/**
 * Санитизирует значение, заменяя чувствительные данные на [REDACTED]
 */
function sanitizeValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  // Если это строка и она похожа на токен/пароль (длинная строка без пробелов)
  if (typeof value === 'string') {
    // Если строка длиннее 20 символов и не содержит пробелов, возможно это токен
    if (value.length > 20 && !value.includes(' ') && !value.includes('\n')) {
      // Но не маскируем URL и другие безопасные строки
      if (!value.startsWith('http') && !value.includes('://')) {
        return '[REDACTED]';
      }
    }
  }

  return value;
}

/**
 * Санитизирует объект, удаляя или маскируя чувствительные данные
 */
export function sanitizeForLogging(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  // Если это примитив, возвращаем как есть (кроме строк, которые могут быть токенами)
  if (typeof data !== 'object') {
    return sanitizeValue(data);
  }

  // Если это массив, санитизируем каждый элемент
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForLogging(item));
  }

  // Если это объект, санитизируем каждое свойство
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (isSensitiveKey(key)) {
      // Чувствительный ключ - заменяем на [REDACTED]
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      // Рекурсивно санитизируем вложенные объекты
      sanitized[key] = sanitizeForLogging(value);
    } else {
      // Обычное значение - проверяем, не является ли оно чувствительным
      sanitized[key] = sanitizeValue(value);
    }
  }

  return sanitized;
}

/**
 * Безопасно сериализует объект для логирования
 * Удаляет чувствительные данные перед сериализацией
 */
export function safeStringify(data: unknown, space?: number): string {
  try {
    const sanitized = sanitizeForLogging(data);
    return JSON.stringify(sanitized, null, space);
  } catch {
    // Если не удалось сериализовать, возвращаем безопасное сообщение
    return '[Unable to serialize data]';
  }
}

/**
 * Создает безопасный контекст для логирования
 * Удаляет чувствительные данные из контекста
 */
export function createSafeLogContext(context?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!context) {
    return undefined;
  }

  return sanitizeForLogging(context) as Record<string, unknown>;
}
