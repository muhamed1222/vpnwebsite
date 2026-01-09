/**
 * Вспомогательные функции для шагов настройки VPN
 */

import { logError } from './logging';
import { getTelegramWebApp } from '@/lib/telegram';

/**
 * Обработка ошибок при открытии deep links
 */
export async function handleDeepLinkError(
  url: string,
  error: unknown,
  context: string
): Promise<void> {
  logError(`Failed to open deep link in ${context}`, error, {
    page: 'setup',
    action: context,
    url
  });

  const webApp = getTelegramWebApp();
  
  try {
    if (webApp && webApp.showAlert) {
      webApp.showAlert('Не удалось открыть ссылку. Попробуйте еще раз или скопируйте ссылку вручную.');
    } else {
      // Fallback: пробуем window.open
      window.open(url, '_blank');
    }
  } catch (fallbackError) {
    logError(`Failed to show alert or open link fallback in ${context}`, fallbackError, {
      page: 'setup',
      action: `${context}Fallback`,
      url
    });
  }
}

/**
 * Валидация URL подписки
 */
export function validateSubscriptionUrl(url: string | null | undefined): boolean {
  if (!url) {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    // Проверяем, что это валидный URL и использует http/https
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Проверка установки приложения через deep link
 * Возвращает true, если приложение может быть открыто
 */
export async function checkAppInstalled(deepLink: string): Promise<boolean> {
  return new Promise((resolve) => {
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(false);
      }
    }, 2000); // 2 секунды на проверку

    try {
      const webApp = getTelegramWebApp();
      if (webApp && webApp.openLink) {
        webApp.openLink(deepLink);
        // Если ссылка открылась без ошибки, считаем что приложение установлено
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve(true);
          }
        }, 500);
      } else {
        // В браузере проверка невозможна
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve(false);
        }
      }
    } catch (error) {
      logError('Failed to check app installation', error, {
        page: 'setup',
        action: 'checkAppInstalled',
        deepLink
      });
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve(false);
      }
    }
  });
}

/**
 * Безопасное открытие внешних ссылок
 */
export function handleExternalLink(url: string): void {
  try {
    const webApp = getTelegramWebApp();
    if (webApp && webApp.openLink) {
      webApp.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  } catch (error) {
    logError('Failed to open external link', error, {
      page: 'setup',
      action: 'handleExternalLink',
      url
    });
    
    // Fallback: пробуем window.open
    try {
      window.open(url, '_blank');
    } catch (fallbackError) {
      logError('Failed to open external link via window.open fallback', fallbackError, {
        page: 'setup',
        action: 'handleExternalLinkFallback',
        url
      });
      
      // Последний fallback: показываем сообщение
      const webApp = getTelegramWebApp();
      if (webApp && webApp.showAlert) {
        webApp.showAlert('Не удалось открыть ссылку. Попробуйте скопировать её вручную.');
      }
    }
  }
}
