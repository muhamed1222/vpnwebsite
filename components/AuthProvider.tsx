'use client';

import { useEffect } from 'react';
import { login } from '@/lib/auth';
import { useSubscriptionStore } from '@/store/subscription.store';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import { logError } from '@/lib/utils/logging';

/**
 * Компонент для инициализации авторизации при загрузке приложения
 * Вызывает login() автоматически при монтировании
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { loading } = useSubscriptionStore();
  
  // Инициализация Telegram WebApp (развертывание, viewport, и т.д.)
  useTelegramWebApp();

  useEffect(() => {
    // Автоматическая авторизация при загрузке приложения
    const initAuth = async () => {
      try {
        await login();
      } catch (error) {
        logError('Auth initialization failed', error, {
          page: 'app',
          action: 'initAuth'
        });
      }
    };

    initAuth();

    // 1. Слушаем возвращение пользователя в приложение (стандартный браузерный API)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        login(true).catch(() => {}); // Обновляем данные при возврате (тихо)
      }
    };

    // 2. Слушаем фокус окна (дополнительная страховка)
    const handleFocus = () => {
      login(true).catch(() => {});
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Можно показать loading screen пока идет авторизация
  // Но для Telegram Mini Apps обычно лучше показывать контент сразу
  return <>{children}</>;
}

