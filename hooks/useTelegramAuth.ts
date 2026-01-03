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
            // Очищаем токен из URL
            const newHash = hash.split('?')[0];
            window.history.replaceState({}, document.title, window.location.pathname + newHash);
            return;
          }
        }

        // 2. Проверяем существующую сессию (куки) - это исправит вылет при перезагрузке
        console.log('[useTelegramAuth] Checking existing session...');
        try {
          const meResponse = await fetch(`${API_BASE_URL}/v1/auth/me`, {
            credentials: 'include',
          });

          if (meResponse.ok) {
            const meData = await meResponse.json();
            console.log('[useTelegramAuth] Session found:', meData);
            setUser({
              tgId: meData.user.tgId,
              username: meData.user.username,
              firstName: meData.user.firstName,
            });
            setState('authenticated');
            return;
          }
        } catch (meErr) {
          console.log('[useTelegramAuth] No existing session');
        }

        // 3. Если мы внутри Telegram WebApp (Mini App)
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
          }
        }

        // 4. Если ничего не помогло
        console.log('[useTelegramAuth] Not authenticated');
        setState('not_in_telegram');
      } catch (err) {
        console.error('[useTelegramAuth] Auth error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setState('error');
      }
    };

    authenticate();
  }, []);

  return { state, user, error };
}
