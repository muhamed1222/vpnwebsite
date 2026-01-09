'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { logError } from '@/lib/utils/logging';
import { getCache, setCache } from '@/lib/utils/cache';

export interface Tariff {
  id: string;
  name: string;
  days: number;
  price_stars: number;
  price_rub?: number;
}

const CACHE_KEY = 'tariffs';
const CACHE_TTL = 5 * 60 * 1000; // 5 минут

/**
 * Хук для загрузки тарифов с кэшированием
 */
export function useTariffs() {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTariffs = async () => {
      // Проверяем кэш
      const cachedTariffs = getCache<Tariff[]>(CACHE_KEY);
      if (cachedTariffs !== null && cachedTariffs.length > 0) {
        setTariffs(cachedTariffs);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await api.getTariffs();
        setTariffs(data);
        // Сохраняем в кэш
        setCache(CACHE_KEY, data, CACHE_TTL);
      } catch (err) {
        logError('Failed to load tariffs', err, {
          page: 'useTariffs',
          action: 'loadTariffs'
        });
        setError('Не удалось загрузить тарифы. Попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };

    loadTariffs();
  }, []);

  return { tariffs, loading, error };
}
