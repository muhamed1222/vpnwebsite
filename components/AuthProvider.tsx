'use client';

import { useEffect } from 'react';
import { login } from '@/lib/auth';
import { useSubscriptionStore } from '@/store/subscription.store';

/**
 * Компонент для инициализации авторизации при загрузке приложения
 * Вызывает login() автоматически при монтировании
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { loading } = useSubscriptionStore();

  useEffect(() => {
    // Автоматическая авторизация при загрузке приложения
    login().catch((error) => {
      // Ошибка уже обработана в login()
      console.error('Auth initialization failed:', error);
    });
  }, []);

  // Можно показать loading screen пока идет авторизация
  // Но для Telegram Mini Apps обычно лучше показывать контент сразу
  return <>{children}</>;
}

