'use client';

import React, { useEffect, useState, lazy, Suspense, useMemo } from 'react';
import { Plug, Settings, User, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { initTelegramWebApp, getTelegramPlatform } from '@/lib/telegram';
import { useSubscriptionStore } from '@/store/subscription.store';
import { LogoIcon } from '@/components/ui/LogoIcon';
import { BackgroundCircles } from '@/components/ui/BackgroundCircles';
import { SUBSCRIPTION_CONFIG } from '@/lib/constants';
import { checkTelegramWebApp, getPlatformSafe, isOnline, subscribeToOnlineStatus } from '@/lib/telegram-fallback';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SubscriptionCardSkeleton } from '@/components/ui/SkeletonLoader';

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
  const [minPrice, setMinPrice] = useState<number>(SUBSCRIPTION_CONFIG.MIN_PRICE);
  
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

  // Загружаем минимальную цену из тарифов
  useEffect(() => {
    const loadMinPrice = async () => {
      // Ждем инициализации Telegram WebApp
      const { checkTelegramWebApp } = await import('@/lib/telegram-fallback');
      const { isAvailable } = checkTelegramWebApp();
      
      if (!isAvailable) {
        // Если Telegram WebApp недоступен, не загружаем тарифы
        return;
      }

      try {
        const { api } = await import('@/lib/api');
        const tariffs = await api.getTariffs();
        if (tariffs.length > 0) {
          // Находим минимальную цену среди всех тарифов
          const min = Math.min(...tariffs.map(t => t.price_stars));
          setMinPrice(min);
        }
      } catch (error) {
        // Тихая ошибка - просто используем дефолтное значение
        // Не логируем, чтобы не засорять консоль
      }
    };
    
    // Задержка для инициализации Telegram WebApp
    const timer = setTimeout(loadMinPrice, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Инициализируем Telegram WebApp с проверкой доступности
    const { isAvailable } = checkTelegramWebApp();
    if (isAvailable) {
      initTelegramWebApp();
    } else {
      console.warn('Telegram WebApp not available, running in fallback mode');
    }

    // Подписываемся на изменения онлайн статуса
    // Используем setTimeout для избежания синхронного setState
    setTimeout(() => {
      setIsOnlineStatus(isOnline());
    }, 0);
    
    const unsubscribe = subscribeToOnlineStatus((status) => {
      setTimeout(() => {
        setIsOnlineStatus(status);
      }, 0);
    });
    
    return unsubscribe;
  }, []);

  return (
    <main 
      className="relative min-h-screen overflow-hidden font-sans select-none flex flex-col bg-main-gradient"
      role="main"
      aria-label="Главная страница Outlivion VPN"
    >
      {/* Logo Section */}
      <div className="relative h-fit flex items-center justify-center">
        {/* Background Circles - оптимизированный компонент */}
        <BackgroundCircles>
          <div className="relative w-32 h-32 flex items-center justify-center">
            <LogoIcon className="w-full h-full" />
          </div>
        </BackgroundCircles>
      </div>

      {/* Bottom Main Card */}
      <div className="absolute bottom-4 left-4 right-4 bg-[#121212] rounded-[16px] px-[14px] py-[14px] shadow-2xl border border-white/5 backdrop-blur-[7px]">
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
                <p className={`text-xs font-medium ${
                  subscription?.status === 'active' 
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
            - Отображение минимальной стоимости ("от 150 ₽")
          */}
          <Link 
            href="/purchase"
            className="w-full h-fit bg-[#F55128] hover:bg-[#d43d1f] active:scale-[0.98] transition-all rounded-[10px] flex items-center px-[14px] py-[14px] justify-between text-white group"
            aria-label="Купить подписку VPN, начиная от 150 рублей"
          >
            <div className="flex items-center gap-[10px]">
              <div className="p-0 rounded-xl" aria-hidden="true">
                <Plug size={24} className="rotate-45" aria-hidden="true" />
              </div>
              <span className="text-base font-medium">Купить подписку</span>
            </div>
            <span className="text-base font-medium opacity-80 group-hover:opacity-100 transition-opacity" aria-label={`Цена от ${minPrice} рублей`}>
              от {minPrice} ₽
            </span>
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
              onClick={() => setIsSupportOpen(true)}
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
