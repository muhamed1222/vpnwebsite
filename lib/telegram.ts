import type { TelegramWebApp } from '@/types/telegram';

/**
 * Получает экземпляр Telegram WebApp API
 * 
 * @returns Экземпляр TelegramWebApp или null, если не доступен (не в Telegram или на сервере)
 * 
 * @example
 * ```ts
 * const webApp = getTelegramWebApp();
 * if (webApp) {
 *   webApp.showAlert('Привет!');
 * }
 * ```
 */
export const getTelegramWebApp = (): TelegramWebApp | null => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
};

/**
 * Инициализирует Telegram WebApp (вызывает ready() и expand())
 * Настраивает цвета темы, если доступны
 * 
 * @example
 * ```ts
 * // В компоненте при монтировании
 * useEffect(() => {
 *   initTelegramWebApp();
 * }, []);
 * ```
 */
export const initTelegramWebApp = () => {
  const webApp = getTelegramWebApp();
  if (webApp) {
    try {
      webApp.ready();
      webApp.expand();
    } catch {
      // Игнорируем ошибки инициализации
    }
    
    // Настройка темы (может не поддерживаться в старых версиях)
    try {
      if (typeof webApp.setHeaderColor === 'function') {
        webApp.setHeaderColor('secondary_bg_color');
      }
    } catch {
      // Метод не поддерживается
    }
    
    try {
      if (typeof webApp.setBackgroundColor === 'function') {
        webApp.setBackgroundColor('bg_color');
      }
    } catch {
      // Метод не поддерживается
    }
  }
};

/**
 * Получает initData строку из Telegram WebApp
 * Используется для авторизации API запросов
 * 
 * @returns initData строка или пустая строка, если не доступна
 * 
 * @example
 * ```ts
 * const initData = getTelegramInitData();
 * // Используется в заголовках запросов: Authorization: ${initData}
 * ```
 */
export const getTelegramInitData = () => {
  const webApp = getTelegramWebApp();
  return webApp?.initData || '';
};

import type { TelegramUser } from '@/types/telegram';

/**
 * Получает данные пользователя Telegram из WebApp
 * 
 * @returns Объект TelegramUser или null, если не доступен
 * 
 * @example
 * ```ts
 * const user = getTelegramUser();
 * if (user) {
 *   console.log(`Привет, ${user.first_name}!`);
 * }
 * ```
 */
export const getTelegramUser = (): TelegramUser | null => {
  const webApp = getTelegramWebApp();
  return webApp?.initDataUnsafe?.user || null;
};

/**
 * Получает платформу, на которой запущено приложение Telegram
 * Преобразует внутренние названия платформ в понятные
 * 
 * @returns Название платформы ('iOS', 'Android', 'macOS', 'Desktop', 'Web' или 'Devices')
 * 
 * @example
 * ```ts
 * const platform = getTelegramPlatform();
 * // 'iOS' | 'Android' | 'macOS' | 'Desktop' | 'Web' | 'Devices'
 * ```
 */
export const getTelegramPlatform = () => {
  const webApp = getTelegramWebApp();
  const platform = webApp?.platform || 'unknown';
  
  // Маппинг платформ Telegram на понятные названия
  const platformMap: Record<string, string> = {
    'ios': 'iOS',
    'android': 'Android',
    'macos': 'macOS',
    'tdesktop': 'Desktop',
    'web': 'Web',
    'weba': 'Web',
  };

  return platformMap[platform.toLowerCase()] || 'Devices';
};

/**
 * Вызывает тактильный отклик (Haptic Feedback)
 * @param type - тип отклика ('light', 'medium', 'heavy', 'rigid', 'soft' или 'success', 'warning', 'error')
 */
export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' | 'success' | 'warning' | 'error' = 'light') => {
  const webApp = getTelegramWebApp();
  if (!webApp?.HapticFeedback) return;

  try {
    if (['success', 'warning', 'error'].includes(type)) {
      webApp.HapticFeedback.notificationOccurred(type as 'success' | 'warning' | 'error');
    } else {
      webApp.HapticFeedback.impactOccurred(type as 'light' | 'medium' | 'heavy' | 'rigid' | 'soft');
    }
  } catch {
    // Игнорируем ошибки тактильного отклика
  }
};