'use client';

import { useEffect, useCallback } from 'react';
import { getTelegramWebApp } from '@/lib/telegram';

/**
 * Хук для инициализации и управления Telegram WebApp
 * Обеспечивает разворачивание шторки, установку CSS-переменных высоты
 * и поддержку полноэкранного режима.
 */
export function useTelegramWebApp() {
  const setViewportVars = useCallback(() => {
    const tg = getTelegramWebApp();
    if (!tg) return;

    const height = tg.viewportHeight;
    const stableHeight = tg.viewportStableHeight;

    document.documentElement.style.setProperty('--tg-viewport-height', `${height}px`);
    document.documentElement.style.setProperty('--tg-viewport-stable-height', `${stableHeight}px`);
    
    // Также обновляем стандартную высоту для fallback
    document.documentElement.style.setProperty('--vh', `${height * 0.01}px`);
  }, []);

  const handleFullscreenError = useCallback(() => {
    const tg = getTelegramWebApp();
    if (tg) {
      tg.expand();
    }
  }, []);

  useEffect(() => {
    const tg = getTelegramWebApp();
    if (!tg) return;

    // 1. Сообщаем Telegram, что приложение готово
    tg.ready();

    // 2. Разворачиваем шторку на максимум
    const expandApp = () => {
      try {
        tg.expand();
        // Блокируем свайп вниз для закрытия (доступно в новых версиях SDK)
        if (tg.disableVerticalSwipes) {
          tg.disableVerticalSwipes();
        }
      } catch (e) {
        console.error('Telegram expand/disableSwipes failed:', e);
      }
    };

    // Вызываем сразу и через небольшую паузу для гарантии
    expandApp();
    const timer = setTimeout(expandApp, 150);

    // 3. Пытаемся включить полноэкранный режим, если поддерживается (начиная с версии 8.0)
    // ВНИМАНИЕ: Многие клиенты разрешают это только после клика пользователя
    if (tg.isVersionAtLeast('8.0') && tg.requestFullscreen) {
      try {
        tg.requestFullscreen();
      } catch (e) {
        // Это нормально, если заблокировано браузером до первого клика
      }
    }

    // 4. Устанавливаем начальные значения CSS переменных
    setViewportVars();

    // 5. Подписываемся на события
    tg.onEvent('viewportChanged', setViewportVars);
    tg.onEvent('fullscreenChanged', setViewportVars);
    tg.onEvent('fullscreenFailed', handleFullscreenError);

    return () => {
      clearTimeout(timer);
      tg.offEvent('viewportChanged', setViewportVars);
      tg.offEvent('fullscreenChanged', setViewportVars);
      tg.offEvent('fullscreenFailed', handleFullscreenError);
    };
  }, [setViewportVars, handleFullscreenError]);

  /**
   * Функция для ручного запроса полноэкранного режима (например, по клику)
   */
  const requestFullscreen = useCallback(() => {
    const tg = getTelegramWebApp();
    if (tg && tg.isVersionAtLeast('8.0') && tg.requestFullscreen) {
      tg.requestFullscreen();
    }
  }, []);

  return {
    isTelegram: !!getTelegramWebApp(),
    requestFullscreen,
  };
}

