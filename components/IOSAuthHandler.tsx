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
      console.log('[iOS Auth] iOS auth mode detected, waiting for Telegram Web App API...');
      
      // Функция для получения initData и отправки deep link
      const processAuth = () => {
        // Проверяем доступность Telegram Web App API
        const { isAvailable } = checkTelegramWebApp();
        
        if (!isAvailable) {
          console.error('[iOS Auth] Telegram Web App API not available');
          return;
        }
        
        const tg = getTelegramWebApp();
        
        if (!tg) {
          console.error('[iOS Auth] Telegram Web App not found');
          return;
        }
        
        try {
          // Инициализируем Web App
          tg.ready();
          tg.expand();
          
          // Получаем initData из Telegram Web App
          const initData = tg.initData || '';
          
          console.log('[iOS Auth] initData length:', initData.length);
          
          if (!initData || typeof initData !== 'string' || initData.length === 0) {
            console.error('[iOS Auth] initData not available or empty');
            console.error('[iOS Auth] tg.initData:', tg.initData);
            console.error('[iOS Auth] tg.initDataUnsafe:', tg.initDataUnsafe);
            return;
          }
          
          // Формируем deep link для iOS приложения
          const encodedInitData = encodeURIComponent(initData);
          const deepLink = `outlivion://auth?token=${encodedInitData}`;
          
          console.log('[iOS Auth] Sending deep link to iOS app:', deepLink.substring(0, 100) + '...');
          
          // Метод 1: Используем openLink из Telegram Web App API (рекомендуется)
          if (typeof tg.openLink === 'function') {
            console.log('[iOS Auth] Using tg.openLink()');
            tg.openLink(deepLink);
          } 
          // Метод 2: Используем window.location.href (fallback)
          else {
            console.log('[iOS Auth] Using window.location.href (fallback)');
            window.location.href = deepLink;
          }
          
          // Метод 3: Дополнительный fallback через iframe (на всякий случай)
          setTimeout(() => {
            try {
              const link = document.createElement('a');
              link.href = deepLink;
              link.style.display = 'none';
              document.body.appendChild(link);
              link.click();
              setTimeout(() => {
                if (link.parentNode) {
                  document.body.removeChild(link);
                }
              }, 100);
            } catch (e) {
              console.error('[iOS Auth] Fallback link error:', e);
            }
          }, 300);
          
        } catch (error) {
          console.error('[iOS Auth] Error processing auth:', error);
        }
      };
      
      // Вариант 1: Если Telegram Web App API уже доступен
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        // Ждем небольшой задержки для полной инициализации
        setTimeout(processAuth, 500);
      }
      // Вариант 2: Ждем загрузки скрипта Telegram Web App
      else {
        const checkInterval = setInterval(() => {
          if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            clearInterval(checkInterval);
            processAuth();
          }
        }, 100);
        
        // Таймаут через 5 секунд (если API не загрузился)
        setTimeout(() => {
          clearInterval(checkInterval);
          if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            processAuth();
          } else {
            console.error('[iOS Auth] Telegram Web App API not loaded after 5 seconds');
          }
        }, 5000);
      }
    }
  }, []);

  // Компонент не рендерит ничего видимого
  return null;
}
