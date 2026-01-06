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
    webApp.ready();
    webApp.expand();
    // Настройка темы
    webApp.setHeaderColor('secondary_bg_color');
    webApp.setBackgroundColor('bg_color');
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

