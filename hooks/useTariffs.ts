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
 * 
 * Использует двухуровневое кэширование:
 * 1. localStorage кэш (5 минут) для быстрой загрузки при повторном открытии
 * 2. API кэш (cachedFetch) для дедупликации запросов в памяти
 * 
 * При монтировании проверяет localStorage кэш и сразу показывает данные,
 * затем загружает актуальные данные в фоне (не блокируя UI).
 * 
 * @returns Объект с тарифами, состоянием загрузки и ошибкой
 * 
 * @example
 * ```tsx
 * const { tariffs, loading, error } = useTariffs();
 * 
 * if (loading) return <Loading />;
 * if (error) return <Error message={error} />;
 * 
 * return tariffs.map(tariff => <TariffCard key={tariff.id} {...tariff} />);
 * ```
 */
export function useTariffs() {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTariffs = async () => {
      // Проверяем localStorage кэш (персистентный между сессиями)
      // API уже кэширует через cachedFetch в памяти (для дедупликации запросов)
      // localStorage кэш используется для быстрой загрузки при повторном открытии страницы
      const cachedTariffs = getCache<Tariff[]>(CACHE_KEY);
      if (cachedTariffs !== null && cachedTariffs.length > 0) {
        setTariffs(cachedTariffs);
        setLoading(false);
        // Загружаем актуальные данные в фоне (но не блокируем UI)
        api.getTariffs()
          .then(data => {
            setTariffs(data);
            setCache(CACHE_KEY, data, CACHE_TTL);
          })
          .catch(() => {
            // Игнорируем ошибки фоновой загрузки, используем кэш
          });
        return;
      }

      try {
        setLoading(true);
        setError(null);
        // API.getTariffs() уже использует cachedFetch для кэширования в памяти
        const data = await api.getTariffs();
        setTariffs(data);
        // Сохраняем в localStorage для персистентности между сессиями
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
