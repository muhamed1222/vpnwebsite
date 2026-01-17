'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { getCache, setCache } from '@/lib/utils/cache';
import { checkTelegramWebApp } from '@/lib/telegram-fallback';
import { ApiException } from '@/lib/api';
import { handleApiError } from '@/lib/utils/errorHandler';

const CACHE_KEY = 'min_price';
const CACHE_TTL = 5 * 60 * 1000; // 5 минут
const DEFAULT_PRICE = 99;

/**
 * Хук для загрузки минимальной цены из тарифов с кэшированием
 * Оптимизирован для уменьшения ререндеров
 */
export function useMinPrice() {
  const [minPrice, setMinPrice] = useState<number>(DEFAULT_PRICE);
  const [isLoading, setIsLoading] = useState(true);

  const loadMinPrice = useCallback(async () => {
    // Проверяем кэш
    const cachedPrice = getCache<number>(CACHE_KEY);
    if (cachedPrice !== null) {
      setMinPrice(cachedPrice);
      setIsLoading(false);
      return;
    }

    // Ждем инициализации Telegram WebApp
    const { isAvailable } = checkTelegramWebApp();
    if (!isAvailable) {
      setIsLoading(false);
      return;
    }

    try {
      const tariffs = await api.getTariffs();
      
      if (tariffs && tariffs.length > 0) {
        // Находим минимальную цену среди всех тарифов в рублях (исключая plan_7)
        const validTariffs = tariffs.filter(t => t.id !== 'plan_7');
        if (validTariffs.length > 0) {
          const prices = validTariffs
            .map(t => t.price_rub || t.price_stars)
            .filter((p): p is number => p != null && p > 0);
          
          if (prices.length > 0) {
            const min = Math.min(...prices);
            setMinPrice(min);
            // Сохраняем в кэш
            setCache(CACHE_KEY, min, CACHE_TTL);
          } else {
            setMinPrice(DEFAULT_PRICE);
          }
        } else {
          setMinPrice(DEFAULT_PRICE);
        }
      } else {
        setMinPrice(DEFAULT_PRICE);
      }
    } catch (error) {
      // Проверяем, является ли это ожидаемой сетевой ошибкой
      const isNetworkError = 
        (error instanceof ApiException && 
          (error.message.includes('Проблема с подключением') || 
           error.message.includes('Request timeout'))) ||
        (error instanceof Error && 
          (error.message.includes('Проблема с подключением') || 
           error.message.includes('Request timeout') ||
           error.message.includes('Failed to fetch') ||
           error.name === 'NetworkError'));
      
      // Используем централизованный обработчик только для неожидаемых ошибок
      if (!isNetworkError) {
        handleApiError(error, {
          page: 'home',
          action: 'loadMinPrice',
        });
      }
      
      // Используем дефолтное значение
      setMinPrice(DEFAULT_PRICE);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    
    // Задержка для инициализации Telegram WebApp
    const timer = setTimeout(() => {
      if (!cancelled) {
        loadMinPrice();
      }
    }, 500);
    
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [loadMinPrice]);

  return { minPrice, isLoading };
}
