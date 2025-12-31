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
      try {
        // 1. Проверяем наличие токена в URL (вход по ссылке из бота)
        // Поддерживаем как HashRouter (#/auth?token=...), так и обычные параметры
        const hash = window.location.hash;
        const search = window.location.search;
        const urlParams = new URLSearchParams(
          hash.includes('?') ? hash.split('?')[1] : search
        );
        const loginToken = urlParams.get('token');

        if (loginToken) {
          console.log('[useTelegramAuth] Token found in URL, authenticating...');
          const response = await fetch(`${API_BASE_URL}/v1/auth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ token: loginToken }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log('[useTelegramAuth] Token auth success:', data);
            setUser({
              tgId: data.user.tgId,
              username: data.user.username,
              firstName: data.user.firstName,
            });
            setState('authenticated');
            // Очищаем токен из URL для красоты
            const newHash = hash.split('?')[0];
            window.history.replaceState({}, document.title, window.location.pathname + newHash);
            return;
          } else {
            console.warn('[useTelegramAuth] Token auth failed, status:', response.status);
          }
        }

        // 2. Если мы внутри Telegram WebApp (Mini App)
        // @ts-ignore
        const tg = window.Telegram?.WebApp;
        
        if (tg && tg.initData) {
          console.log('[useTelegramAuth] Running inside Telegram WebApp');
          tg.ready();
          
          const response = await fetch(`${API_BASE_URL}/v1/auth/telegram`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ initData: tg.initData }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log('[useTelegramAuth] Telegram auth success:', data);
            setUser({
              tgId: data.user.tgId,
              username: data.user.username,
              firstName: data.user.firstName,
            });
            setState('authenticated');
            return;
          } else {
            const errData = await response.json().catch(() => ({}));
            console.error('[useTelegramAuth] Telegram auth failed:', errData);
            throw new Error(errData.message || 'Authentication failed');
          }
        }

        // 3. Если ничего не помогло - значит мы просто в браузере и не авторизованы
        console.log('[useTelegramAuth] Not in Telegram and no token found');
        setState('not_in_telegram');
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
