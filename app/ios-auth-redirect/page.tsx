'use client';

import { useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Промежуточная страница для редиректа на deep link iOS приложения
 * Telegram не может открывать custom URL schemes напрямую, поэтому используем HTTPS страницу
 */
function IOSAuthRedirectContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (!token || redirectedRef.current) {
      return;
    }

    // Формируем deep link
    const deepLink = `outlivion://auth?token=${encodeURIComponent(token)}`;
    
    console.log('[iOS Auth Redirect] Redirecting to deep link:', deepLink.substring(0, 100) + '...');
    redirectedRef.current = true;
    
    // Метод 1: Прямой редирект через window.location
    // В Safari это откроет приложение, если оно установлено
    try {
      window.location.href = deepLink;
    } catch (e) {
      console.error('[iOS Auth Redirect] window.location.href failed:', e);
      
      // Метод 2: Fallback через создание ссылки и клик
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
      } catch (e2) {
        console.error('[iOS Auth Redirect] link.click() failed:', e2);
      }
    }
  }, [token]);

  if (!token) {
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
        <div style={{ fontSize: '14px', opacity: 0.8 }}>Токен авторизации не найден</div>
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
      <div style={{ fontSize: '18px', marginBottom: '20px' }}>Перенаправление...</div>
      <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '20px' }}>Открытие приложения Outlivion</div>
      {token && (
        <div
          onClick={() => {
            const deepLink = `outlivion://auth?token=${encodeURIComponent(token)}`;
            window.location.href = deepLink;
          }}
          style={{
            fontSize: '12px',
            opacity: 0.6,
            textDecoration: 'underline',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          Если приложение не открылось, нажмите здесь
        </div>
      )}
    </div>
  );
}

export default function IOSAuthRedirectPage() {
  return (
    <Suspense
      fallback={
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
          <div style={{ fontSize: '18px', marginBottom: '20px' }}>Загрузка...</div>
          <div style={{ fontSize: '14px', opacity: 0.7 }}>Получение данных авторизации</div>
        </div>
      }
    >
      <IOSAuthRedirectContent />
    </Suspense>
  );
}
