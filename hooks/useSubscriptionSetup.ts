'use client';

import { useState, useEffect, useCallback } from 'react';
import { getTelegramWebApp } from '@/lib/telegram';
import { config } from '@/lib/config';
import { SUBSCRIPTION_CONFIG } from '@/lib/constants';
import { api } from '@/lib/api';
import { logError } from '@/lib/utils/logging';
import { analytics } from '@/lib/analytics';
import { validateSubscriptionUrl, handleExternalLink } from '@/lib/utils/setupHelpers';
import type { SubscriptionStatus } from '@/types/setup';
import { SETUP_CONSTANTS } from '@/lib/utils/setupConstants';

export interface SubscriptionUrlState {
  url: string | null;
  isLoading: boolean;
  isDefault: boolean;
}

export interface SubscriptionStatusState {
  status: SubscriptionStatus;
}

export interface UseSubscriptionSetupReturn {
  subscriptionUrl: SubscriptionUrlState;
  subscriptionStatus: SubscriptionStatusState;
  isAdding: boolean;
  isChecking: boolean;
  checkFailed: boolean;
  addSubscription: (platform: string) => Promise<void>;
  checkSubscriptionAdded: () => Promise<boolean>;
  checkVpnStatus: () => Promise<void>;
}

/**
 * Хук для управления логикой работы с подпиской в процессе установки
 */
export function useSubscriptionSetup(): UseSubscriptionSetupReturn {
  const [subscriptionUrl, setSubscriptionUrl] = useState<string | null>(null);
  const [isLoadingSubscriptionUrl, setIsLoadingSubscriptionUrl] = useState(true);
  const [isDefaultSubscriptionUrl, setIsDefaultSubscriptionUrl] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('checking');
  const [isAddingSubscription, setIsAddingSubscription] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);
  const [subscriptionCheckFailed, setSubscriptionCheckFailed] = useState(false);

  // Загружаем реальную ссылку на подписку пользователя
  useEffect(() => {
    const loadSubscriptionUrl = async () => {
      try {
        const configData = await api.getUserConfig();
        const defaultUrl = `${config.payment.subscriptionBaseUrl}/api/sub/${SUBSCRIPTION_CONFIG.DEFAULT_SUBSCRIPTION_ID}`;
        
        if (configData.ok && configData.config) {
          try {
            new URL(configData.config);
            setSubscriptionUrl(configData.config);
            setIsDefaultSubscriptionUrl(false);
          } catch (urlError) {
            logError('Invalid subscription URL format', urlError, {
              page: 'setup',
              action: 'validateSubscriptionUrl',
              url: configData.config
            });
            setSubscriptionUrl(defaultUrl);
            setIsDefaultSubscriptionUrl(true);
          }
        } else {
          setSubscriptionUrl(defaultUrl);
          setIsDefaultSubscriptionUrl(true);
        }
      } catch (error) {
        logError('Failed to load subscription URL', error, {
          page: 'setup',
          action: 'loadSubscriptionUrl'
        });
        analytics.event('setup_error', {
          step: 1,
          action: 'loadSubscriptionUrl',
          error: error instanceof Error ? error.message : String(error)
        });
        const defaultUrl = `${config.payment.subscriptionBaseUrl}/api/sub/${SUBSCRIPTION_CONFIG.DEFAULT_SUBSCRIPTION_ID}`;
        setSubscriptionUrl(defaultUrl);
        setIsDefaultSubscriptionUrl(true);
      } finally {
        setIsLoadingSubscriptionUrl(false);
      }
    };
    loadSubscriptionUrl();
  }, []);

  // Проверка статуса подписки перед началом настройки
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const status = await api.getUserStatus();
        setSubscriptionStatus(status.ok && status.status === 'active' ? 'active' : 'inactive');
      } catch (error) {
        logError('Failed to check subscription status', error, {
          page: 'setup',
          action: 'checkSubscription'
        });
        setSubscriptionStatus('inactive');
      }
    };
    checkSubscription();
  }, []);

  /**
   * Добавление подписки через Deep Link
   */
  const addSubscription = useCallback(async (platform: string) => {
    analytics.event('setup_add_subscription', { step: 3 });
    
    if (isAddingSubscription) return;
    
    setIsAddingSubscription(true);
    setSubscriptionCheckFailed(false);
    
    try {
      const userSubscriptionUrl = subscriptionUrl || `${config.payment.subscriptionBaseUrl}/api/sub/${SUBSCRIPTION_CONFIG.DEFAULT_SUBSCRIPTION_ID}`;

      if (!validateSubscriptionUrl(userSubscriptionUrl)) {
        logError('Invalid subscription URL in addSubscription', undefined, {
          page: 'setup',
          action: 'addSubscription',
          url: userSubscriptionUrl
        });
        analytics.event('setup_error', {
          step: 3,
          action: 'addSubscription',
          error: 'Invalid subscription URL'
        });
        
        const webApp = getTelegramWebApp();
        if (webApp?.showAlert) {
          webApp.showAlert('Ошибка: неверный формат ссылки на подписку. Попробуйте обновить страницу или скопируйте ссылку и добавьте её вручную в приложении.');
        }
        setIsAddingSubscription(false);
        return;
      }

      const protocol = platform === 'iOS' ? config.deepLink.iosProtocol : config.deepLink.defaultProtocol;
      const vpnName = config.deepLink.vpnName;
      const subUrl = `${protocol}${userSubscriptionUrl}#${vpnName}`;

      try {
        handleExternalLink(subUrl);
        analytics.event('setup_subscription_deeplink_opened', { step: 3, platform });
      } catch (error) {
        logError('Failed to open deep link for subscription', error, {
          page: 'setup',
          action: 'addSubscription',
          url: subUrl,
          platform
        });
        analytics.event('setup_error', {
          step: 3,
          action: 'addSubscription',
          error: error instanceof Error ? error.message : String(error),
          type: 'deep_link_error'
        });
        
        const webApp = getTelegramWebApp();
        if (webApp?.showAlert) {
          webApp.showAlert('Не удалось открыть приложение автоматически. Пожалуйста, скопируйте ссылку на подписку и добавьте её вручную в приложении v2RayTun. Нажмите "Как добавить вручную?" для инструкции.');
        }
        
        setSubscriptionCheckFailed(true);
        setIsAddingSubscription(false);
      }
    } catch (error) {
      logError('Failed to add subscription', error, {
        page: 'setup',
        action: 'addSubscription',
        platform
      });
      analytics.event('setup_error', {
        step: 3,
        action: 'addSubscription',
        error: error instanceof Error ? error.message : String(error),
        type: 'general_error'
      });
      
      const webApp = getTelegramWebApp();
      if (webApp?.showAlert) {
        webApp.showAlert('Произошла ошибка при добавлении подписки. Попробуйте скопировать ссылку и добавить её вручную в приложении v2RayTun.');
      }
      
      setSubscriptionCheckFailed(true);
      setIsAddingSubscription(false);
    }
  }, [subscriptionUrl, isAddingSubscription]);

  /**
   * Проверка успешности добавления подписки с повторными попытками
   */
  const checkSubscriptionAdded = useCallback(async (): Promise<boolean> => {
    setIsCheckingSubscription(true);
    setSubscriptionCheckFailed(false);
    analytics.event('setup_check_subscription', { step: 3 });
    
    const checkWithRetry = async (attempts = 0, maxAttempts = SETUP_CONSTANTS.MAX_RETRY_ATTEMPTS): Promise<boolean> => {
      try {
        const configData = await api.getUserConfig();
        
        if (configData.ok && configData.config) {
          return true;
        }
        
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, SETUP_CONSTANTS.RETRY_DELAY));
          return checkWithRetry(attempts + 1, maxAttempts);
        }
        
        return false;
      } catch (error) {
        logError('Failed to check subscription addition', error, {
          page: 'setup',
          action: 'checkSubscriptionAdded',
          attempt: attempts
        });
        
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, SETUP_CONSTANTS.RETRY_DELAY));
          return checkWithRetry(attempts + 1, maxAttempts);
        }
        
        return false;
      }
    };
    
    try {
      await new Promise(resolve => setTimeout(resolve, SETUP_CONSTANTS.INITIAL_CHECK_DELAY));
      const success = await checkWithRetry(0, SETUP_CONSTANTS.MAX_RETRY_ATTEMPTS);
      
      if (success) {
        analytics.event('setup_subscription_confirmed', { step: 3 });
        const webApp = getTelegramWebApp();
        if (webApp?.showAlert) {
          webApp.showAlert('Подписка успешно добавлена! Переходим к следующему шагу.');
        }
        return true;
      } else {
        setSubscriptionCheckFailed(true);
        const webApp = getTelegramWebApp();
        if (webApp?.showAlert) {
          webApp.showAlert('Не удалось подтвердить добавление подписки. Если вы добавили подписку вручную, нажмите "Проверить снова" или "Далее" для продолжения.');
        }
        return false;
      }
    } catch (error) {
      logError('Failed to check subscription addition', error, {
        page: 'setup',
        action: 'checkSubscriptionAdded'
      });
      analytics.event('setup_error', {
        step: 3,
        action: 'checkSubscriptionAdded',
        error: error instanceof Error ? error.message : String(error)
      });
      setSubscriptionCheckFailed(true);
      return false;
    } finally {
      setIsCheckingSubscription(false);
    }
  }, []);

  /**
   * Проверка статуса подписки VPN
   */
  const checkVpnStatus = useCallback(async () => {
    analytics.event('setup_check_vpn', { step: 4 });
    
    try {
      const statusData = await api.getUserStatus();
      
      const webApp = getTelegramWebApp();
      if (statusData.ok && statusData.status === 'active') {
        if (webApp?.showAlert) {
          webApp.showAlert('Подписка VPN активна в системе. Убедитесь, что вы включили VPN в приложении v2RayTun для использования защищенного подключения.');
        }
        analytics.event('setup_vpn_subscription_confirmed', { step: 4 });
      } else {
        if (webApp?.showAlert) {
          webApp.showAlert('Подписка VPN не активна в системе. Проверьте, что вы правильно добавили подписку на шаге 3, и что подписка не истекла.');
        }
      }
    } catch (error) {
      logError('Failed to check VPN subscription status', error, {
        page: 'setup',
        action: 'checkVpnStatus'
      });
      analytics.event('setup_error', {
        step: 4,
        action: 'checkVpnStatus',
        error: error instanceof Error ? error.message : String(error)
      });
      const webApp = getTelegramWebApp();
      if (webApp?.showAlert) {
        webApp.showAlert('Не удалось проверить статус подписки. Убедитесь, что вы включили VPN в приложении v2RayTun для использования защищенного подключения.');
      }
    }
  }, []);

  return {
    subscriptionUrl: {
      url: subscriptionUrl,
      isLoading: isLoadingSubscriptionUrl,
      isDefault: isDefaultSubscriptionUrl
    },
    subscriptionStatus: {
      status: subscriptionStatus
    },
    isAdding: isAddingSubscription,
    isChecking: isCheckingSubscription,
    checkFailed: subscriptionCheckFailed,
    addSubscription,
    checkSubscriptionAdded,
    checkVpnStatus
  };
}
