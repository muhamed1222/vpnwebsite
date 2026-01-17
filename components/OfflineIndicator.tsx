'use client';

import { useEffect, useState } from 'react';
import { SignalSlashIcon, SignalIcon } from '@heroicons/react/24/outline';
import { isOnline, subscribeToOnlineStatus } from '@/lib/telegram-fallback';

export function OfflineIndicator() {
  const [isOnlineStatus, setIsOnlineStatus] = useState(true);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Инициализируем состояние асинхронно
    const initialStatus = isOnline();
    requestAnimationFrame(() => {
      setIsOnlineStatus(initialStatus);
    });
    
    const unsubscribe = subscribeToOnlineStatus((status) => {
      setIsOnlineStatus(status);
      
      // Показываем индикатор только при переходе в офлайн
      if (!status) {
        setShow(true);
      } else {
        // Скрываем через 2 секунды после восстановления
        setTimeout(() => {
          setShow(false);
        }, 2000);
      }
    });

    return unsubscribe;
  }, []);

  if (!show && isOnlineStatus) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        show ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div
        className={`px-4 py-3 text-center text-sm font-medium ${
          isOnlineStatus
            ? 'bg-green-500/90 text-white'
            : 'bg-yellow-500/90 text-white'
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          {isOnlineStatus ? (
            <>
              <SignalIcon className="w-4 h-4" />
              <span>Подключение восстановлено</span>
            </>
          ) : (
            <>
              <SignalSlashIcon className="w-4 h-4" />
              <span>Нет подключения к интернету</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
