import { api } from './api';
import { useUserStore } from '../store/user.store';
import { useSubscriptionStore } from '../store/subscription.store';
import { getTelegramUser } from './telegram';
import { getTelegramWebApp } from './telegram';

export interface LoginResult {
  success: boolean;
  error?: string;
}

/**
 * Авторизация пользователя через Telegram WebApp
 * 
 * @param silent - Если true, не менять состояние loading в сторе
 * @returns Результат авторизации с информацией об ошибке при неудаче
 */
export const login = async (silent = false): Promise<LoginResult> => {
  const userStore = useUserStore.getState();
  const subStore = useSubscriptionStore.getState();
  const webApp = getTelegramWebApp();
  
  if (!silent) {
    subStore.setLoading(true);
  }
  
  // Получаем базового пользователя из Telegram SDK для немедленного отображения
  const tgUser = getTelegramUser();
  
  // В режиме разработки при локальном запуске (без Telegram) используем mock данные
  const isDevelopment = process.env.NODE_ENV === 'development';
  // Проверяем, что это действительно браузер (не Telegram) и нет валидного initData
  const isLocalDev = typeof window !== 'undefined' && (!webApp || !webApp.initData);

  if (isDevelopment && isLocalDev) {
    // В dev режиме без Telegram используем mock пользователя и продолжаем работу
    console.log('[Auth] Development mode: Using mock user data for local development');
    if (tgUser) {
      userStore.setUser({
        id: tgUser.id || 12345678,
        firstName: tgUser.first_name || 'Developer',
        username: tgUser.username || 'dev',
      });
    } else {
      userStore.setUser({
        id: 12345678,
        firstName: 'Developer',
        username: 'dev',
      });
    }
    subStore.setStatus('none');
    if (!silent) {
      subStore.setLoading(false);
    }
    return { success: true }; // Возвращаем success без попытки авторизации
  }

  try {
    if (tgUser) {
      userStore.setUser({
        id: tgUser.id,
        firstName: tgUser.first_name,
        username: tgUser.username,
      });
    }

    // Авторизация на бэкенде
    const data = await api.auth();
    
    if (data.user) {
      userStore.setUser(data.user);
    }
    
    if (data.subscription) {
      subStore.setSubscription(data.subscription);
    } else {
      subStore.setStatus('none');
    }
    
    // Сохраняем скидку пользователя
    if (data.discount) {
      subStore.setDiscount(data.discount);
    } else {
      subStore.setDiscount(null);
    }

    return { success: true };
  } catch (error) {
    // В режиме разработки при локальном запуске (без Telegram) не показываем ошибки
    // Проверяем снова в catch блоке, на случай если проверка выше не сработала
    if (isDevelopment && isLocalDev) {
      // В dev режиме без Telegram просто логируем и продолжаем работу
      console.warn('[Auth] Development mode: API error occurred, continuing without backend auth', error);
      // Устанавливаем дефолтного пользователя для разработки, если его еще нет
      if (!tgUser) {
        userStore.setUser({
          id: 12345678,
          firstName: 'Developer',
          username: 'dev',
        });
      }
      subStore.setStatus('none');
      return { success: true }; // Возвращаем success, чтобы приложение продолжало работать
    }

    // Используем централизованный обработчик ошибок
    const { handleApiError } = await import('./utils/errorHandler');
    const errorMessage = handleApiError(error, {
      action: 'auth',
      page: 'auth',
    });

    // В случае ошибки выставляем статус "none"
    subStore.setStatus('none');

    return {
      success: false,
      error: errorMessage,
    };
  } finally {
    subStore.setLoading(false);
  }
};

