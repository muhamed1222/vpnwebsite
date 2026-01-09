'use client';

import { useState, useEffect } from 'react';
import { getTelegramPlatform } from '@/lib/telegram';
import { getPlatformSafe, checkTelegramWebApp } from '@/lib/telegram-fallback';

/**
 * Хук для определения платформы пользователя
 * Использует Telegram WebApp API для определения платформы, если доступно
 */
export function usePlatform(): string {
  const [platform, setPlatform] = useState<string>('Devices');

  useEffect(() => {
    // Определяем платформу после монтирования для избежания hydration mismatch
    if (typeof window !== 'undefined') {
      const { isAvailable } = checkTelegramWebApp();
      
      // Используем setTimeout для предотвращения синхронного setState
      const timer = setTimeout(() => {
        if (isAvailable) {
          setPlatform(getTelegramPlatform());
        } else {
          setPlatform(getPlatformSafe());
        }
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, []);

  return platform;
}
