'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { config } from '@/lib/config';
import { SUBSCRIPTION_CONFIG } from '@/lib/constants';
import { logError } from '@/lib/utils/logging';
import { getCache, setCache } from '@/lib/utils/cache';

const CACHE_KEY = 'subscription_url';
const CACHE_TTL = 10 * 60 * 1000; // 10 минут

/**
 * Хук для загрузки subscription URL с кэшированием и валидацией
 */
export function useSubscriptionUrl() {
  const [subscriptionUrl, setSubscriptionUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSubscriptionUrl = async () => {
      // Проверяем кэш
      const cachedUrl = getCache<string>(CACHE_KEY);
      if (cachedUrl !== null) {
        // Валидация URL из кэша
        try {
          new URL(cachedUrl);
          setSubscriptionUrl(cachedUrl);
          setLoading(false);
          return;
        } catch {
          // Если URL невалидный, удаляем из кэша и загружаем заново
        }
      }

      try {
        setLoading(true);
        setError(null);
        const configData = await api.getUserConfig();
        
        if (configData.ok && configData.config) {
          // Валидация URL перед использованием
          try {
            new URL(configData.config);
            setSubscriptionUrl(configData.config);
            // Сохраняем в кэш
            setCache(CACHE_KEY, configData.config, CACHE_TTL);
          } catch (urlError) {
            logError('Invalid subscription URL format', urlError, {
              page: 'useSubscriptionUrl',
              action: 'validateSubscriptionUrl',
              url: configData.config
            });
            // Используем дефолтную ссылку
            const defaultUrl = `${config.payment.subscriptionBaseUrl}/api/sub/${SUBSCRIPTION_CONFIG.DEFAULT_SUBSCRIPTION_ID}`;
            setSubscriptionUrl(defaultUrl);
          }
        } else {
          // Если конфиг не получен, используем дефолтную ссылку
          const defaultUrl = `${config.payment.subscriptionBaseUrl}/api/sub/${SUBSCRIPTION_CONFIG.DEFAULT_SUBSCRIPTION_ID}`;
          setSubscriptionUrl(defaultUrl);
        }
      } catch (err) {
        logError('Failed to load subscription URL', err, {
          page: 'useSubscriptionUrl',
          action: 'loadSubscriptionUrl'
        });
        setError('Не удалось загрузить ссылку на подписку');
        // Используем дефолтную ссылку при ошибке
        const defaultUrl = `${config.payment.subscriptionBaseUrl}/api/sub/${SUBSCRIPTION_CONFIG.DEFAULT_SUBSCRIPTION_ID}`;
        setSubscriptionUrl(defaultUrl);
      } finally {
        setLoading(false);
      }
    };

    loadSubscriptionUrl();
  }, []);

  return { subscriptionUrl, loading, error };
}
