import { getTelegramWebApp } from './telegram';

/**
 * Проверяет доступность Telegram WebApp и предоставляет fallback
 */
export function checkTelegramWebApp(): {
  isAvailable: boolean;
  webApp: ReturnType<typeof getTelegramWebApp>;
} {
  const webApp = getTelegramWebApp();
  const isAvailable = !!webApp;

  if (!isAvailable && typeof window !== 'undefined') {
    console.warn('Telegram WebApp not available. Running in fallback mode.');
  }

  return {
    isAvailable,
    webApp,
  };
}

/**
 * Безопасное получение платформы с fallback
 */
export function getPlatformSafe(): string {
  if (typeof window === 'undefined') {
    return 'Unknown';
  }

  const userAgent = navigator.userAgent || navigator.vendor || (window as Window & { opera?: string }).opera || '';
  
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as Window & { MSStream?: unknown }).MSStream) {
    return 'iOS';
  }
  
  if (/android/i.test(userAgent)) {
    return 'Android';
  }
  
  if (/Mac/.test(navigator.platform)) {
    return 'macOS';
  }
  
  if (/Win/.test(navigator.platform)) {
    return 'Windows';
  }
  
  if (/Linux/.test(navigator.platform)) {
    return 'Linux';
  }
  
  return 'Unknown';
}

/**
 * Проверяет онлайн статус
 */
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') {
    return true; // SSR - предполагаем что онлайн
  }
  
  return navigator.onLine ?? true;
}

/**
 * Подписывается на изменения онлайн статуса
 */
export function subscribeToOnlineStatus(callback: (isOnline: boolean) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {}; // SSR - нет подписки
  }

  // Используем setTimeout для избежания синхронного вызова callback
  const handleOnline = () => setTimeout(() => callback(true), 0);
  const handleOffline = () => setTimeout(() => callback(false), 0);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

