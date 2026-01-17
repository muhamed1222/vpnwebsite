import type { TelegramWebApp } from '@/types/telegram';

export const getTelegramWebApp = (): TelegramWebApp | null => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
};

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

export const getTelegramInitData = () => {
  const webApp = getTelegramWebApp();
  return webApp?.initData || '';
};

import type { TelegramUser } from '@/types/telegram';

export const getTelegramUser = (): TelegramUser | null => {
  const webApp = getTelegramWebApp();
  return webApp?.initDataUnsafe?.user || null;
};

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