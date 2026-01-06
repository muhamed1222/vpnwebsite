import { api, ApiException } from './api';
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
 * @returns Результат авторизации с информацией об ошибке при неудаче
 */
export const login = async (): Promise<LoginResult> => {
  const userStore = useUserStore.getState();
  const subStore = useSubscriptionStore.getState();
  const webApp = getTelegramWebApp();
  
  subStore.setLoading(true);
  
  try {
    // Получаем базового пользователя из Telegram SDK для немедленного отображения
    const tgUser = getTelegramUser();
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

    return { success: true };
  } catch (error) {
    let errorMessage = 'Не удалось выполнить авторизацию';

    if (error instanceof ApiException) {
      switch (error.status) {
        case 401:
          errorMessage = 'Ошибка авторизации. Пожалуйста, перезапустите приложение.';
          break;
        case 0:
          errorMessage = 'Проблема с подключением к интернету. Проверьте соединение.';
          break;
        case 500:
          errorMessage = 'Ошибка сервера. Попробуйте позже.';
          break;
        default:
          errorMessage = error.message || 'Произошла ошибка при авторизации';
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    // Показываем уведомление пользователю через Telegram WebApp
    if (webApp) {
      webApp.showAlert(errorMessage);
    } else {
      // Fallback для браузера
      console.error('Auth failed:', error);
      alert(errorMessage);
    }

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

