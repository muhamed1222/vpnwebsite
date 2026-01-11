'use client';

import { useEffect, useState } from 'react';
import { getTelegramWebApp } from '@/lib/telegram';
import { checkTelegramWebApp } from '@/lib/telegram-fallback';

/**
 * Специальная страница для iOS авторизации
 * Отображает кнопку для открытия deep link, если автоматическое открытие не сработало
 */
export default function IOSAuthPage() {
  const [initData, setInitData] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Проверяем, есть ли параметр ios_auth=1 в URL
    if (typeof window === 'undefined') return;

    const checkAndGetInitData = () => {
      const { isAvailable } = checkTelegramWebApp();

      if (!isAvailable) {
        setStatus('error');
        setErrorMessage('Telegram Web App API недоступен. Убедитесь, что вы открыли это в Telegram.');
        return;
      }

      const tg = getTelegramWebApp();

      if (!tg) {
        setStatus('error');
        setErrorMessage('Telegram Web App не найден.');
        return;
      }

      try {
        // Инициализируем Web App
        tg.ready();
        tg.expand();

        // Получаем initData
        const data = tg.initData || '';

        if (!data || data.length === 0) {
          setStatus('error');
          setErrorMessage('initData не доступен. Убедитесь, что вы открыли это через Telegram бота.');
          return;
        }

        setInitData(data);
        setStatus('ready');

        // Автоматически пытаемся открыть deep link
        tryOpenDeepLink(data);
      } catch (error) {
        console.error('[iOS Auth] Error:', error);
        setStatus('error');
        setErrorMessage('Ошибка при получении данных авторизации.');
      }
    };

    // Ждем загрузки Telegram Web App API
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      setTimeout(checkAndGetInitData, 500);
    } else {
      const checkInterval = setInterval(() => {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
          clearInterval(checkInterval);
          checkAndGetInitData();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkInterval);
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
          checkAndGetInitData();
        } else {
          setStatus('error');
          setErrorMessage('Telegram Web App API не загрузился.');
        }
      }, 5000);
    }
  }, []);

  const tryOpenDeepLink = (data: string) => {
    const encodedInitData = encodeURIComponent(data);
    const deepLink = `outlivion://auth?token=${encodedInitData}`;

    console.log('[iOS Auth] Attempting to open deep link:', deepLink.substring(0, 100) + '...');

    const tg = getTelegramWebApp();

    // Метод 1: Используем openLink
    if (tg && typeof tg.openLink === 'function') {
      try {
        console.log('[iOS Auth] Using tg.openLink()');
        tg.openLink(deepLink);
        return;
      } catch (e) {
        console.error('[iOS Auth] tg.openLink() failed:', e);
      }
    }

    // Метод 2: Используем window.location
    try {
      console.log('[iOS Auth] Using window.location.href');
      window.location.href = deepLink;
    } catch (e) {
      console.error('[iOS Auth] window.location.href failed:', e);
    }
  };

  const handleButtonClick = () => {
    if (initData) {
      tryOpenDeepLink(initData);
    } else {
      setStatus('error');
      setErrorMessage('Данные авторизации недоступны. Перезагрузите страницу.');
    }
  };

  if (status === 'loading') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        background: '#181818',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ fontSize: '18px', marginBottom: '20px' }}>Загрузка...</div>
        <div style={{ fontSize: '14px', opacity: 0.7 }}>Получение данных авторизации</div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        background: '#181818',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '18px', marginBottom: '20px', color: '#ff4444' }}>Ошибка</div>
        <div style={{ fontSize: '14px', marginBottom: '30px', opacity: 0.8 }}>{errorMessage}</div>
        {initData && (
          <button
            onClick={handleButtonClick}
            style={{
              background: '#0b99ff',
              color: 'white',
              border: 'none',
              padding: '14px 30px',
              borderRadius: '22px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Открыть в приложении
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      background: '#181818',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '24px', marginBottom: '16px', fontWeight: '600' }}>
        Авторизация в Outlivion
      </div>
      <div style={{ fontSize: '16px', marginBottom: '30px', opacity: 0.8 }}>
        Нажмите кнопку ниже, чтобы вернуться в приложение
      </div>
      <button
        onClick={handleButtonClick}
        style={{
          background: '#0b99ff',
          color: 'white',
          border: 'none',
          padding: '14px 30px',
          borderRadius: '22px',
          fontSize: '16px',
          cursor: 'pointer',
          fontWeight: '500',
          width: '100%',
          maxWidth: '356px'
        }}
      >
        Открыть в приложении
      </button>
      <div style={{ fontSize: '12px', marginTop: '20px', opacity: 0.6 }}>
        Если кнопка не работает, скопируйте эту ссылку и откройте в Safari
      </div>
      {initData && (
        <div style={{
          fontSize: '10px',
          marginTop: '10px',
          opacity: 0.4,
          wordBreak: 'break-all',
          maxWidth: '100%'
        }}>
          {`outlivion://auth?token=${encodeURIComponent(initData).substring(0, 50)}...`}
        </div>
      )}
    </div>
  );
}
