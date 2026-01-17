/**
 * Понятные сообщения для пользователя
 * Преобразует технические ошибки в понятные пользовательские сообщения
 */

/**
 * Маппинг технических сообщений на понятные для пользователя
 */
export const USER_FRIENDLY_MESSAGES: Record<string, string> = {
  // Сетевые ошибки
  'Failed to fetch': 'Проблема с подключением к интернету. Проверьте соединение и попробуйте снова.',
  'Network error': 'Проблема с подключением к интернету. Проверьте соединение и попробуйте снова.',
  'Network error or timeout': 'Превышено время ожидания. Проверьте интернет-соединение и попробуйте снова.',
  'CORS': 'Ошибка подключения к серверу. Попробуйте позже.',
  'NetworkError': 'Проблема с подключением к интернету. Проверьте соединение и попробуйте снова.',
  
  // API ошибки
  'API endpoint не найден': 'Сервис временно недоступен. Попробуйте позже.',
  'API endpoint не найден. Проверьте конфигурацию сервера.': 'Сервис временно недоступен. Попробуйте позже.',
  'API endpoint не найден. Проверьте, что сервер запущен и роут доступен.': 'Сервис временно недоступен. Попробуйте позже.',
  'Failed to fetch active contest': 'Не удалось загрузить информацию о конкурсе. Попробуйте позже.',
  'Failed to fetch summary': 'Не удалось загрузить данные. Попробуйте позже.',
  'Failed to fetch friends': 'Не удалось загрузить список друзей. Попробуйте позже.',
  'Failed to fetch tickets': 'Не удалось загрузить историю билетов. Попробуйте позже.',
  'Failed to fetch participants': 'Не удалось загрузить участников. Попробуйте позже.',
  
  // HTTP статусы
  '401': 'Ошибка авторизации. Пожалуйста, перезапустите приложение.',
  '403': 'Недостаточно прав для выполнения этого действия.',
  '404': 'Запрашиваемый ресурс не найден.',
  '500': 'Ошибка сервера. Попробуйте позже.',
  '503': 'Сервис временно недоступен. Попробуйте позже.',
  
  // Валидация
  'Invalid JSON response': 'Ошибка обработки данных. Попробуйте позже.',
  'Missing Telegram initData': 'Ошибка авторизации. Пожалуйста, перезапустите приложение.',
  
  // Общие ошибки
  'Backend unavailable': 'Сервис временно недоступен. Попробуйте позже.',
  'Network error: Backend unavailable': 'Сервис временно недоступен. Попробуйте позже.',
};

/**
 * Понятные сообщения для HTTP статусов
 */
export const HTTP_STATUS_MESSAGES: Record<number, string> = {
  400: 'Проверьте правильность введенных данных.',
  401: 'Ошибка авторизации. Пожалуйста, перезапустите приложение.',
  403: 'Недостаточно прав для выполнения этого действия.',
  404: 'Запрашиваемый ресурс не найден.',
  408: 'Превышено время ожидания. Попробуйте снова.',
  429: 'Слишком много запросов. Подождите немного и попробуйте снова.',
  500: 'Ошибка сервера. Попробуйте позже.',
  502: 'Сервис временно недоступен. Попробуйте позже.',
  503: 'Сервис временно недоступен. Попробуйте позже.',
  504: 'Превышено время ожидания. Попробуйте снова.',
};

/**
 * Преобразует техническое сообщение об ошибке в понятное для пользователя
 */
export function getUserFriendlyMessage(error: string | Error | unknown): string {
  // Если это Error, берем message
  const errorMessage = error instanceof Error 
    ? error.message 
    : typeof error === 'string'
      ? error
      : String(error);

  // Проверяем точное совпадение
  if (USER_FRIENDLY_MESSAGES[errorMessage]) {
    return USER_FRIENDLY_MESSAGES[errorMessage];
  }

  // Проверяем частичное совпадение (case-insensitive)
  const lowerErrorMessage = errorMessage.toLowerCase();
  for (const [technical, friendly] of Object.entries(USER_FRIENDLY_MESSAGES)) {
    if (lowerErrorMessage.includes(technical.toLowerCase())) {
      return friendly;
    }
  }

  // Проверяем HTTP статусы в сообщении
  const statusMatch = errorMessage.match(/\b(\d{3})\b/);
  if (statusMatch) {
    const status = parseInt(statusMatch[1], 10);
    if (HTTP_STATUS_MESSAGES[status]) {
      return HTTP_STATUS_MESSAGES[status];
    }
  }

  // Если сообщение уже на русском и не содержит технических терминов
  const technicalTerms = [
    'api', 'endpoint', 'server', 'config', 'cors', 'networkerror',
    'typeerror', 'referenceerror', 'syntaxerror', 'failed to fetch',
    'json', 'http', 'status', 'code', 'error', 'exception'
  ];

  const hasTechnicalTerms = technicalTerms.some(term => 
    lowerErrorMessage.includes(term)
  );

  if (!hasTechnicalTerms && /[а-яё]/i.test(errorMessage)) {
    // Сообщение на русском и не содержит технических терминов
    return errorMessage;
  }

  // Дефолтное сообщение
  return 'Что-то пошло не так. Попробуйте перезагрузить приложение.';
}

/**
 * Преобразует HTTP статус в понятное сообщение
 */
export function getHttpStatusMessage(status: number): string {
  return HTTP_STATUS_MESSAGES[status] || 'Ошибка сервера. Попробуйте позже.';
}

/**
 * Проверяет, является ли сообщение техническим
 */
export function isTechnicalMessage(message: string): boolean {
  const technicalPatterns = [
    /api\s*endpoint/i,
    /server\s*config/i,
    /failed\s*to\s*fetch/i,
    /network\s*error/i,
    /cors/i,
    /typeerror/i,
    /referenceerror/i,
    /syntaxerror/i,
    /networkerror/i,
    /\b\d{3}\b/, // HTTP статусы
  ];

  return technicalPatterns.some(pattern => pattern.test(message));
}
