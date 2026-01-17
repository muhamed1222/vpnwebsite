'use client';

import { useEffect, useState } from 'react';
import { SignalSlashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { isOnline, subscribeToOnlineStatus } from '@/lib/telegram-fallback';

export default function OfflinePage() {
  const [isOnlineStatus, setIsOnlineStatus] = useState(true);

  useEffect(() => {
    // Инициализируем состояние асинхронно
    const initialStatus = isOnline();
    requestAnimationFrame(() => {
      setIsOnlineStatus(initialStatus);
    });
    
    const unsubscribe = subscribeToOnlineStatus((status) => {
      setIsOnlineStatus(status);
      
      // Если подключение восстановлено, перезагружаем страницу
      if (status) {
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      }
    });

    return unsubscribe;
  }, []);

  const handleRetry = () => {
    if (isOnlineStatus) {
      window.location.href = '/';
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center border border-yellow-500/20">
            <SignalSlashIcon className="w-12 h-12 text-yellow-500" />
          </div>
        </div>
        
        <h1 className="text-2xl font-semibold mb-4 text-foreground">
          Нет подключения к интернету
        </h1>
        
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Проверьте подключение к интернету и попробуйте снова.
        </p>

        {isOnlineStatus ? (
          <div className="space-y-4">
            <p className="text-green-500 text-sm">
              Подключение восстановлено. Перенаправление...
            </p>
            <button
              onClick={handleRetry}
              className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowPathIcon className="w-5 h-5" />
              Перейти на главную
            </button>
          </div>
        ) : (
          <button
            onClick={handleRetry}
            className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
              <ArrowPathIcon className="w-5 h-5" />
            Попробовать снова
          </button>
        )}
      </div>
    </div>
  );
}
