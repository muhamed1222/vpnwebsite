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
    tg.expand();

    // 3. Пытаемся включить полноэкранный режим, если поддерживается
    // Примечание: в некоторых версиях может потребоваться жест пользователя
    if (tg.requestFullscreen) {
      try {
        tg.requestFullscreen();
      } catch (e) {
        console.warn('Telegram WebApp requestFullscreen failed:', e);
      }
    }

    // 4. Устанавливаем начальные значения CSS переменных
    setViewportVars();

    // 5. Подписываемся на события изменения viewport
    tg.onEvent('viewportChanged', setViewportVars);
    
    // 6. Подписываемся на события полноэкранного режима
    tg.onEvent('fullscreenChanged', setViewportVars);
    tg.onEvent('fullscreenFailed', handleFullscreenError);

    return () => {
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
    if (tg && tg.requestFullscreen) {
      tg.requestFullscreen();
    }
  }, []);

  return {
    isTelegram: !!getTelegramWebApp(),
    requestFullscreen,
  };
}

