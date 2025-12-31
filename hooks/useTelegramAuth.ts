import { useState, useEffect } from 'react';

export interface TelegramAuthUser {
  tgId: number;
  username?: string;
  firstName?: string;
}

export type TelegramAuthState = 'loading' | 'authenticated' | 'not_in_telegram' | 'error';

interface UseTelegramAuthResult {
  state: TelegramAuthState;
  user: TelegramAuthUser | null;
  error: string | null;
}

const API_BASE_URL = 'https://api.outlivion.space';

/**
 * Хук для авторизации через Telegram WebApp
 */
export function useTelegramAuth(): UseTelegramAuthResult {
  const [state, setState] = useState<TelegramAuthState>('loading');
  const [user, setUser] = useState<TelegramAuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authenticate = async () => {
      // Проверяем наличие Telegram WebApp
      if (typeof window === 'undefined' || !window.Telegram?.WebApp) {
        console.log('[useTelegramAuth] Telegram WebApp not found');
        setState('not_in_telegram');
        return;
      }

      const tg = window.Telegram.WebApp;
      
      try {
        // Инициализируем Telegram WebApp
        tg.ready();
        
        // Даем время Telegram WebApp полностью инициализироваться
        // Иногда initData может быть пустым сразу после ready()
        await new Promise(resolve => setTimeout(resolve, 100));

        // Получаем initData
        const initData = tg.initData;

        console.log('[useTelegramAuth] initData check:', {
          exists: !!initData,
          type: typeof initData,
          length: initData?.length || 0,
          preview: initData ? initData.substring(0, 50) + '...' : 'empty'
        });

        if (!initData || typeof initData !== 'string' || initData.length === 0) {
          console.warn('[useTelegramAuth] initData is empty or invalid');
          setState('not_in_telegram');
          return;
        }

        console.log('[useTelegramAuth] Sending auth request to:', `${API_BASE_URL}/v1/auth/telegram`);

        // Отправляем запрос на авторизацию
        const response = await fetch(`${API_BASE_URL}/v1/auth/telegram`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // withCredentials: true
          body: JSON.stringify({ initData }),
        });

        console.log('[useTelegramAuth] Response status:', response.status, response.statusText);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('[useTelegramAuth] Auth failed:', errorData);
          throw new Error(errorData.error || errorData.message || `Authentication failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('[useTelegramAuth] Auth success:', data);
        
        if (data.ok && data.user) {
          setUser({
            tgId: data.user.tgId,
            username: data.user.username,
            firstName: data.user.firstName,
          });
          setState('authenticated');
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (err) {
        console.error('[useTelegramAuth] Error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setState('error');
      }
    };

    authenticate();
  }, []);

  return { state, user, error };
}

