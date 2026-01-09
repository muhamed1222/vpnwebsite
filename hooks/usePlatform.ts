'use client';

import { useState, useEffect } from 'react';
import { getTelegramPlatform } from '@/lib/telegram';
import { getPlatformSafe } from '@/lib/telegram-fallback';

/**
 * Хук для определения платформы пользователя
 */
export function usePlatform() {
  const [platform, setPlatform] = useState<string>('Devices');

  useEffect(() => {
    // Определяем платформу после монтирования для избежания hydration mismatch
    if (typeof window !== 'undefined') {
      const { checkTelegramWebApp } = require('@/lib/telegram-fallback');
      const { isAvailable } = checkTelegramWebApp();
      
      if (isAvailable) {
        setPlatform(getTelegramPlatform());
      } else {
        setPlatform(getPlatformSafe());
      }
    }
  }, []);

  return platform;
}
