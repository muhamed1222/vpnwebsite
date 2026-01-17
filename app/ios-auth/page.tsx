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

  const tryOpenDeepLink = (data: string) => {
    const encodedInitData = encodeURIComponent(data);
    const deepLink = `outlivion://auth?token=${encodedInitData}`;

    console.log('[iOS Auth] Attempting to open deep link:', deepLink.substring(0, 100) + '...');

    const tg = getTelegramWebApp();

    // Telegram Mini App может не поддерживать открытие custom URL schemes напрямую
    // Используем несколько методов

    // Метод 1: Прямое изменение location (может работать в некоторых случаях)
    try {
      console.log('[iOS Auth] Trying window.location.href');
      window.location.href = deepLink;
      
      // Если через 500ms мы все еще на странице, пробуем другие методы
      setTimeout(() => {
        console.log('[iOS Auth] Location change didn\'t work, trying alternatives');
      }, 500);
    } catch (e) {
      console.error('[iOS Auth] window.location.href failed:', e);
    }

    // Метод 2: Создаем скрытый iframe (для некоторых браузеров)
    try {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = deepLink;
      document.body.appendChild(iframe);
      
      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    } catch (e) {
      console.error('[iOS Auth] iframe method failed:', e);
    }

    // Метод 3: Создаем и кликаем по ссылке
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
      console.error('[iOS Auth] link.click() failed:', e);
    }

    // Метод 4: Пробуем tg.openLink (может не работать с custom schemes)
    if (tg && typeof tg.openLink === 'function') {
      try {
        console.log('[iOS Auth] Trying tg.openLink()');
        tg.openLink(deepLink);
      } catch (e) {
        console.error('[iOS Auth] tg.openLink() failed:', e);
      }
    }
  };

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
      <div style={{ fontSize: '16px', marginBottom: '10px', opacity: 0.8, textAlign: 'center' }}>
        К сожалению, Telegram Mini App не может открыть приложение напрямую.
      </div>
      <div style={{ fontSize: '14px', marginBottom: '30px', opacity: 0.7, textAlign: 'center' }}>
        Скопируйте ссылку ниже и откройте её в Safari:
      </div>
      <button
        onClick={handleButtonClick}
        onTouchStart={handleButtonClick}
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
          maxWidth: '356px',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        Открыть в приложении
      </button>
      {initData && (
        <>
          <div style={{ fontSize: '12px', marginTop: '30px', opacity: 0.7, marginBottom: '10px' }}>
            Или скопируйте ссылку ниже:
          </div>
          <div
            onClick={() => {
              const deepLink = `outlivion://auth?token=${encodeURIComponent(initData)}`;
              navigator.clipboard.writeText(deepLink).then(() => {
                alert('Ссылка скопирована! Откройте её в Safari.');
              }).catch(() => {
                // Fallback для старых браузеров
                const textarea = document.createElement('textarea');
                textarea.value = deepLink;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                alert('Ссылка скопирована! Откройте её в Safari.');
              });
            }}
            style={{
              fontSize: '11px',
              marginTop: '10px',
              opacity: 0.6,
              wordBreak: 'break-all',
              maxWidth: '100%',
              padding: '10px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '8px',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {`outlivion://auth?token=${encodeURIComponent(initData).substring(0, 80)}...`}
            <br />
            <span style={{ fontSize: '10px', opacity: 0.8 }}>(нажмите, чтобы скопировать)</span>
          </div>
        </>
      )}
    </div>
  );
}
