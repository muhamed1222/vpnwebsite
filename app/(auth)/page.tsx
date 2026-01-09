'use client';

import React, { useEffect, useState, lazy, Suspense, useMemo, startTransition } from 'react';
import { Plug, Settings, User, MessageSquare, Gift } from 'lucide-react';
import Link from 'next/link';
import { initTelegramWebApp, getTelegramPlatform, triggerHaptic } from '@/lib/telegram';
import { useSubscriptionStore } from '@/store/subscription.store';
import { LogoIcon } from '@/components/ui/LogoIcon';
import { BackgroundCircles } from '@/components/ui/BackgroundCircles';
import { SUBSCRIPTION_CONFIG } from '@/lib/constants';
import { checkTelegramWebApp, getPlatformSafe, isOnline, subscribeToOnlineStatus } from '@/lib/telegram-fallback';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SubscriptionCardSkeleton, SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { logError } from '@/lib/utils/logging';
import { getCache, setCache } from '@/lib/utils/cache';

// Lazy loading для модалок - загружаются только когда нужны
const SupportModal = lazy(() =>
  import('@/components/blocks/SupportModal').then(module => ({
    default: module.SupportModal
  }))
);

/**
 * Форматирует дату в формате YYYY-MM-DD в читаемый формат на русском языке
 * Пример: "2025-12-05" -> "5 декабря 2025"
 * 
 * @param dateString - Дата в формате ISO (YYYY-MM-DD)
 * @returns Отформатированная строка даты на русском языке
 */
const formatExpirationDate = (dateString?: string): string => {
  if (!dateString) return '—';

  const date = new Date(dateString);
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
};

export default function Home() {
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isOnlineStatus, setIsOnlineStatus] = useState(true);
  const [minPrice, setMinPrice] = useState<number>(99);
  const [isPriceLoading, setIsPriceLoading] = useState(true);

  // Инициализируем платформу с fallback
  const [platform] = useState(() => {
    if (typeof window !== 'undefined') {
      const { isAvailable } = checkTelegramWebApp();
      if (isAvailable) {
        return getTelegramPlatform();
      }
      return getPlatformSafe();
    }
    return '...';
  });

  const { subscription, loading: subscriptionLoading } = useSubscriptionStore();

  // Мемоизируем форматированную дату для избежания пересчета
  const formattedExpirationDate = useMemo(() => {
    return formatExpirationDate(subscription?.expiresAt);
  }, [subscription?.expiresAt]);

  // Загружаем минимальную цену из тарифов с кэшированием (мемоизировано)
  useEffect(() => {
    let cancelled = false;
    
    const loadMinPrice = async () => {
      // Проверяем кэш (TTL: 5 минут)
      const CACHE_KEY = 'min_price';
      const CACHE_TTL = 5 * 60 * 1000; // 5 минут
      
      const cachedPrice = getCache<number>(CACHE_KEY);
      if (cachedPrice !== null) {
        if (!cancelled) {
          setMinPrice(cachedPrice);
          setIsPriceLoading(false);
        }
        return;
      }

      // Ждем инициализации Telegram WebApp
      const { checkTelegramWebApp } = await import('@/lib/telegram-fallback');
      const { isAvailable } = checkTelegramWebApp();

      if (!isAvailable) {
        if (!cancelled) {
          setIsPriceLoading(false);
        }
        return;
      }

      try {
        const { api } = await import('@/lib/api');
        const tariffs = await api.getTariffs();
        
        if (cancelled) return;
        
        if (tariffs.length > 0) {
          // Находим минимальную цену среди всех тарифов в рублях (исключая plan_7)
          const validTariffs = tariffs.filter(t => t.id !== 'plan_7');
          if (validTariffs.length > 0) {
            const min = Math.min(...validTariffs.map(t => t.price_rub || t.price_stars));
            if (!cancelled) {
              setMinPrice(min);
              // Сохраняем в кэш
              setCache(CACHE_KEY, min, CACHE_TTL);
            }
          } else {
            // Если нет валидных тарифов, используем дефолт 99
            if (!cancelled) {
              setMinPrice(99);
            }
          }
        }
      } catch (error) {
        // Логируем ошибку для мониторинга
        if (!cancelled) {
          logError('Failed to load tariffs for min price', error, {
            page: 'home',
            action: 'loadMinPrice'
          });
        }
        // Используем дефолтное значение - пользователь не увидит ошибку,
        // но цена будет отображаться корректно
      } finally {
        if (!cancelled) {
          setIsPriceLoading(false);
        }
      }
    };

    // Задержка для инициализации Telegram WebApp
    const timer = setTimeout(loadMinPrice, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    // Подписываемся на изменения онлайн статуса
    // Используем startTransition для оптимизации обновлений состояния
    startTransition(() => {
      setIsOnlineStatus(isOnline());
    });

    const unsubscribe = subscribeToOnlineStatus((status) => {
      startTransition(() => {
        setIsOnlineStatus(status);
      });
    });

    return unsubscribe;
  }, []);

  return (
    <main
      className="relative min-h-[var(--tg-viewport-height,100vh)] overflow-hidden font-sans select-none flex flex-col bg-main-gradient safe-area-padding"
      role="main"
      aria-label="Главная страница Outlivion VPN"
    >
      <AnimatedBackground />

      {/* Logo Section */}
      <div className="relative w-full h-fit flex items-center justify-center z-10">
        {/* Background Circles - оптимизированный компонент */}
        <BackgroundCircles>
          <div className="relative w-32 h-32 flex items-center justify-center">
            <LogoIcon className="w-full h-full" />
          </div>
        </BackgroundCircles>
      </div>

      {/* Розыгрыш Баннер */}
      <div className="relative mx-4 mb-4 z-10 mt-4">
        <div className="bg-gradient-to-r from-[#F55128] to-[#FF6B3D] rounded-[16px] px-4 py-4 shadow-lg border border-white/10 backdrop-blur-[12px]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 bg-white/20 rounded-xl">
                <Gift size={24} className="text-white" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-white mb-0.5">Розыгрыш</h2>
                <p className="text-white/90 text-sm">Участвуй и выигрывай призы!</p>
              </div>
            </div>
            <button
              onClick={() => {
                triggerHaptic('light');
                // TODO: Добавить обработчик для перехода к деталям розыгрыша
              }}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 active:scale-95 transition-all rounded-[10px] text-white text-sm font-medium border border-white/30"
              aria-label="Подробнее о розыгрыше"
            >
              Подробнее
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Main Card */}
      <div className="absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 right-4 bg-[#121212]/80 rounded-[16px] px-[14px] py-[14px] shadow-2xl border border-white/5 backdrop-blur-[12px] z-10">
        {/* 
          Header Info - Информационный блок с основными статусами
          
          Содержит три ключевых элемента:
          1. Статус подключения VPN (offline/online)
          2. Дата истечения подписки
          3. Статус подписки (активна/истекла/нет подписки)
        */}
        <div className="flex justify-between items-start mb-8 px-[10px] py-[6px]">
          <div>
            <h1 className="text-2xl font-medium text-white tracking-tight">Outlivion</h1>

            {/* 
              Статус подключения VPN (offline/online)
              
              Назначение: 
              - Отображает текущее состояние VPN-подключения пользователя
              - Визуально информирует о доступности VPN-сервиса
              
              Логика работы:
              - "online" (оранжево-красный цвет #F55128) - отображается когда subscription.status === 'active'
                Это означает, что подписка активна и VPN можно использовать
              - "offline" (приглушенный оранжево-красный #F55128/60) - отображается во всех остальных случаях:
                * subscription.status === 'expired' - подписка истекла
                * subscription.status === 'none' - подписка отсутствует
                * subscription.status === 'loading' - данные загружаются
                * subscription === null - данные не получены
              
              Источник данных: 
              - Получается из useSubscriptionStore
              - Загружается через API при авторизации (lib/auth.ts -> api.auth())
              - Статус 'active' означает, что пользователь имеет активную подписку и может подключиться к VPN
              
              Визуальное оформление:
              - Цвет текста: text-[#F55128]/60 (приглушенный оранжево-красный для offline)
              - Размер: text-base font-medium
            */}
            <p
              className={`text-base font-medium ${!isOnlineStatus ? 'text-yellow-500' : subscription?.status === 'active' ? 'text-[#F55128]' : 'text-[#F55128]/60'}`}
              aria-live="polite"
              aria-label={`Статус VPN: ${!isOnlineStatus ? 'нет подключения к интернету' : subscription?.status === 'active' ? 'онлайн' : 'офлайн'}`}
            >
              {!isOnlineStatus ? 'offline (нет сети)' : subscription?.status === 'active' ? 'online' : 'offline'}
            </p>
          </div>

          <div className="text-right">
            {/* 
              Дата истечения подписки
              
              Назначение:
              - Показывает до какой даты действительна подписка пользователя
              - Помогает пользователю отслеживать срок действия услуги
              
              Логика работы:
              - Если subscription.expiresAt существует, отображается отформатированная дата
              - Форматирование происходит через функцию formatExpirationDate()
                Преобразует ISO формат (2025-12-05) в читаемый вид ("5 декабря 2025")
              - Если даты нет или подписка отсутствует, отображается "—"
              
              Источник данных:
              - subscription.expiresAt из useSubscriptionStore
              - Формат данных: строка в формате ISO (YYYY-MM-DD)
              - Загружается с бэкенда через API при авторизации
              
              Визуальное оформление:
              - Префикс "до": мелкий серый текст (text-white/40 text-xs)
              - Дата: белый текст среднего размера (text-white/80 text-base)
              - Выравнивание: text-right (по правому краю)
            */}
            {subscriptionLoading ? (
              <div className="flex flex-col items-end gap-2">
                <div className="h-5 w-24 bg-white/10 rounded animate-pulse" aria-hidden="true" />
                <div className="h-4 w-20 bg-white/10 rounded animate-pulse" aria-hidden="true" />
              </div>
            ) : (
              <>
                <p className="text-white/80 text-base">
                  <span className="text-white/40 text-xs align-middle mr-1">до</span>
                  {formattedExpirationDate}
                </p>

                {/* 
                  Статус подписки (активна/истекла/нет подписки)
                  
                  Назначение:
                  - Информирует пользователя о текущем состоянии его подписки
                  - Помогает понять, нужно ли продлевать подписку
                  
                  Логика работы:
                  - Определяется на основе subscription.status из useSubscriptionStore
                  - Возможные значения:
                    * "активна" - когда status === 'active' (подписка действует)
                    * "подписка истекла" - когда status === 'expired' (срок действия истек)
                    * "нет подписки" - когда status === 'none' (подписка никогда не была оформлена)
                    * "загрузка..." - когда status === 'loading' (данные загружаются)
                  
                  Цветовая индикация:
                  - text-[#F55128] (оранжево-красный) - для статуса "активна"
                  - text-[#D9A14E] (золотистый) - для статуса "подписка истекла" (текущий вариант)
                  - text-white/60 (серый) - для статуса "нет подписки"
                  - text-white/40 (бледно-серый) - для статуса "загрузка..."
                  
                  Источник данных:
                  - subscription.status из useSubscriptionStore
                  - Тип: SubscriptionStatus ('active' | 'expired' | 'none' | 'loading')
                  - Обновляется через API при авторизации и изменениях подписки
                  
                  Визуальное оформление:
                  - Цвет текста: text-[#D9A14E] (золотистый для истекшей подписки)
                  - Размер: text-xs font-medium
                  - Позиция: под датой истечения, выравнивание по правому краю
                */}
                <p className={`text-xs font-medium ${subscription?.status === 'active'
                  ? 'text-[#F55128]'
                  : subscription?.status === 'expired'
                    ? 'text-[#D9A14E]'
                    : subscription?.status === 'none'
                      ? 'text-white/60'
                      : 'text-white/40'
                  }`}>
                  {subscription?.status === 'active'
                    ? 'активна'
                    : subscription?.status === 'expired'
                      ? 'подписка истекла'
                      : subscription?.status === 'none'
                        ? 'нет подписки'
                        : 'загрузка...'}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Buttons Section */}
        <div className="space-y-3">
          {/* 
            Кнопка "Купить подписку" 
            Назначение: Основная CTA кнопка для перехода к выбору и покупке тарифа.
            Функционал: 
            - Переход на страницу выбора планов (/purchase)
            - Отображение минимальной стоимости ("от 99 ₽")
          */}
          <Link
            href="/purchase"
            onClick={() => triggerHaptic('light')}
            className="w-full h-fit bg-[#F55128] hover:bg-[#d43d1f] active:scale-[0.98] transition-all rounded-[10px] flex items-center px-[14px] py-[14px] justify-between text-white group"
            aria-label="Купить подписку VPN, начиная от 99 рублей"
          >
            <div className="flex items-center gap-[10px]">
              <div className="p-0 rounded-xl" aria-hidden="true">
                <Plug size={24} className="rotate-45" aria-hidden="true" />
              </div>
              <span className="text-base font-medium">Купить подписку</span>
            </div>
            {isPriceLoading ? (
              <SkeletonLoader variant="text" width="80px" height="1.25rem" className="inline-block" />
            ) : (
              <span className="text-base font-medium opacity-80 group-hover:opacity-100 transition-opacity" aria-label={`Цена от ${minPrice} рублей`}>
                от {minPrice} ₽
              </span>
            )}
          </Link>

          {/* 
            Кнопка "Установка и настройка" 
            Назначение: Запуск пошагового онбординга для подключения VPN.
            Функционал: 
            - Автоматическое определение платформы пользователя (iOS/Android/macOS)
            - Переход к инструкции по настройке (/setup)
          */}
          <Link
            href="/setup"
            onClick={() => triggerHaptic('light')}
            className="w-full h-fit bg-transparent border border-white/10 hover:bg-white/5 active:scale-[0.98] transition-all rounded-[10px] flex items-center px-[14px] py-[14px] justify-between text-white group mb-[10px]"
            aria-label={`Установка и настройка VPN для ${platform}`}
          >
            <div className="flex items-center gap-[10px]">
              <div className="p-0 rounded-xl" aria-hidden="true">
                <Settings size={24} aria-hidden="true" />
              </div>
              <span className="text-base font-medium">Установка и настройка</span>
            </div>
            <span className="text-[#F55128] text-base font-medium opacity-80 group-hover:opacity-100 transition-opacity" aria-label={`Платформа: ${platform}`}>
              {platform}
            </span>
          </Link>

          {/* Grid Buttons */}
          <div className="grid grid-cols-2 gap-[10px]">
            {/* 
            Кнопка "Профиль" 
            Назначение: Переход в личный кабинет пользователя.
            Функционал: 
            - Отображение текущей подписки
            - Управление способами оплаты
            - Просмотр истории транзакций
            - Реферальная программа
            - Копирование ID пользователя
          */}
            <Link
              href="/profile"
              className="h-fit bg-transparent border border-white/10 hover:bg-white/5 active:scale-[0.98] transition-all rounded-[10px] flex items-center px-[14px] py-[14px] gap-[10px] text-white"
              aria-label="Перейти в профиль пользователя"
            >
              <div className="p-0 rounded-xl" aria-hidden="true">
                <User size={24} aria-hidden="true" />
              </div>
              <span className="text-base font-medium">Профиль</span>
            </Link>
            {/* 
              Кнопка "Поддержка" 
              Назначение: Вызов FAQ и прямой связи с саппортом.
              Функционал: 
              - Открытие модального окна с ответами на частые вопросы
              - Кнопка быстрого перехода в Telegram-чат поддержки
            */}
            <button
              onClick={() => {
                triggerHaptic('medium');
                setIsSupportOpen(true);
              }}
              className="h-fit bg-transparent border border-white/10 hover:bg-white/5 active:scale-[0.98] transition-all rounded-[10px] flex items-center px-[14px] py-[14px] gap-[10px] text-white"
              aria-label="Открыть окно поддержки"
              aria-haspopup="dialog"
            >
              <div className="p-0 rounded-xl" aria-hidden="true">
                <MessageSquare size={24} aria-hidden="true" />
              </div>
              <span className="text-base font-medium">Поддержка</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lazy loaded modal with Suspense */}
      <Suspense fallback={null}>
        <SupportModal
          isOpen={isSupportOpen}
          onClose={() => setIsSupportOpen(false)}
        />
      </Suspense>
    </main>
  );
}
