'use client';

import { useEffect } from 'react';
import { getTelegramWebApp } from '@/lib/telegram';
import { checkTelegramWebApp } from '@/lib/telegram-fallback';

/**
 * Компонент для обработки iOS авторизации через deep link
 * Проверяет параметр ios_auth=1 в URL и отправляет deep link обратно в iOS приложение
 */
export function IOSAuthHandler() {
  useEffect(() => {
    // Проверяем, есть ли параметр ios_auth=1 в URL
    if (typeof window === 'undefined') return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const iosAuth = urlParams.get('ios_auth');
    
    if (iosAuth === '1') {
      // Небольшая задержка, чтобы Telegram Web App API успел инициализироваться
      const timer = setTimeout(() => {
        // Проверяем доступность Telegram Web App API
        const { isAvailable } = checkTelegramWebApp();
        
        if (isAvailable) {
          const tg = getTelegramWebApp();
          
          if (tg) {
            try {
              // Получаем initData из Telegram Web App
              const initData = tg.initData || '';
              
              if (initData && typeof initData === 'string') {
                // Формируем deep link для iOS приложения
                const encodedInitData = encodeURIComponent(initData);
                const deepLink = `outlivion://auth?token=${encodedInitData}`;
                
                console.log('[iOS Auth] Sending deep link to iOS app');
                
                // Отправляем deep link обратно в iOS приложение
                // Telegram Mini App может открыть deep link через window.location
                window.location.href = deepLink;
                
                // Fallback: если не сработало, пробуем через iframe (для некоторых случаев)
                setTimeout(() => {
                  try {
                    const iframe = document.createElement('iframe');
                    iframe.style.display = 'none';
                    iframe.src = deepLink;
                    document.body.appendChild(iframe);
                    
                    // Удаляем iframe после попытки
                    setTimeout(() => {
                      if (iframe.parentNode) {
                        document.body.removeChild(iframe);
                      }
                    }, 1000);
                  } catch (e) {
                    console.error('[iOS Auth] Fallback iframe error:', e);
                  }
                }, 500);
              } else {
                console.error('[iOS Auth] initData not available');
              }
            } catch (error) {
              console.error('[iOS Auth] Error:', error);
            }
          }
        } else {
          console.error('[iOS Auth] Telegram Web App API not available');
        }
      }, 1000); // Задержка для инициализации Telegram Web App API
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Компонент не рендерит ничего видимого
  return null;
}
