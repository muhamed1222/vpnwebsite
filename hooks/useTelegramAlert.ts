/**
 * Хук для работы с Telegram WebApp алертами
 * Устраняет дублирование логики показа алертов
 */

import { useCallback } from 'react';
import { getTelegramWebApp } from '@/lib/telegram';

/**
 * Хук для показа алертов через Telegram WebApp
 * 
 * @example
 * ```tsx
 * const showAlert = useTelegramAlert();
 * 
 * const handleSuccess = () => {
 *   showAlert('Операция выполнена успешно');
 * };
 * ```
 */
export function useTelegramAlert() {
  const showAlert = useCallback((message: string) => {
    const webApp = getTelegramWebApp();
    if (webApp) {
      webApp.showAlert(message);
    } else {
      // Fallback для браузера
      alert(message);
    }
  }, []);

  return showAlert;
}

/**
 * Хук для открытия ссылок через Telegram WebApp
 * 
 * @param useTelegramLink - Если true, использует openTelegramLink вместо openLink
 * 
 * @example
 * ```tsx
 * const openLink = useTelegramLink();
 * 
 * const handleClick = () => {
 *   openLink('https://example.com');
 * };
 * 
 * // Для Telegram ссылок:
 * const openTelegramLink = useTelegramLink(true);
 * openTelegramLink('https://t.me/support');
 * ```
 */
export function useTelegramLink(useTelegramLinkMode = false) {
  const openLink = useCallback((url: string) => {
    const webApp = getTelegramWebApp();
    if (webApp) {
      if (useTelegramLinkMode) {
        webApp.openTelegramLink(url);
      } else {
        webApp.openLink(url);
      }
    } else {
      // Fallback для браузера
      window.open(url, '_blank');
    }
  }, [useTelegramLinkMode]);

  return openLink;
}
