'use client';

import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { ChevronLeftIcon as ChevronLeft } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { SUBSCRIPTION_CONFIG } from '@/lib/constants';
import { api } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useSubscriptionStore } from '@/store/subscription.store';
import { logError } from '@/lib/utils/logging';

// Lazy loading для модалки подтверждения покупки
const PurchaseConfirmModal = lazy(() => 
  import('@/components/blocks/PurchaseConfirmModal').then(m => ({ default: m.PurchaseConfirmModal }))
);

interface Plan {
  id: string;
  duration: string;
  totalPrice: number;
  originalPrice?: number;
  monthlyPrice: number;
  days: number;
  isPopular?: boolean;
  oldPrice?: number;
}

// Конвертация дней в локализованное название
const getDurationFromDays = (days: number): string => {
  if (days === 7) return '7 дней (Тест)';
  if (days === 30) return '1 месяц';
  if (days === 90) return '3 месяца';
  if (days === 180) return '6 месяцев';
  if (days === 365) return '1 год';
  return `${days} дней`;
};

// Расчет даты окончания подписки
const calculateUntilDate = (days: number, currentExpiresAt?: string): string => {
  const now = new Date();
  const baseDate = currentExpiresAt ? new Date(currentExpiresAt) : now;
  
  // Если текущая подписка уже истекла или ее нет, считаем от сегодня
  const startDate = baseDate > now ? baseDate : now;
  
  const finalDate = new Date(startDate);
  finalDate.setDate(finalDate.getDate() + days);

  return finalDate.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export default function PurchasePage() {
  // Выбранный ID тарифного плана (по умолчанию 6 месяцев)
  const [selectedPlanId, setSelectedPlanId] = useState('plan_180');
  // Состояние модального окна подтверждения
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  // Тарифы с бэкенда
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { subscription, discount } = useSubscriptionStore();
  
  // Функция для применения скидки к цене
  const applyDiscount = (price: number, discountPercent: number): number => {
    if (!discountPercent || discountPercent <= 0) return price;
    const discounted = Math.round((price * (100 - discountPercent)) / 100);
    return Math.max(1, discounted); // Минимум 1 рубль
  };

  // Проверяем, есть ли у пользователя оплаченные платежи или активная подписка
  const checkHasPaidOrders = useCallback(async (): Promise<boolean> => {
    try {
      // Проверяем историю платежей
      const payments = await api.getPaymentsHistory();
      const hasPaidPayments = payments.some(p => p.status === 'success');
      
      // Также проверяем статус подписки
      const statusData = await api.getUserStatus();
      const hasActiveSubscription = statusData.ok && statusData.status === 'active';
      
      // Если есть активная подписка или оплаченные платежи - скрываем plan_7
      const result = hasPaidPayments || hasActiveSubscription;
      return result;
    } catch (error) {
      logError('Error checking paid orders', error, {
        page: 'purchase',
        action: 'checkHasPaidOrders'
      });
      // Если не удалось загрузить данные, проверяем локальное состояние подписки
      if (subscription && subscription.status === 'active') {
        return true;
      }
      // Если не удалось проверить, возвращаем false (показываем все тарифы)
      return false;
    }
  }, [subscription]);

  // Загружаем тарифы с бэкенда
  useEffect(() => {
    const loadTariffs = async () => {
      const CACHE_KEY = 'tariffs';
      
      // Очищаем кэш тарифов при загрузке, чтобы всегда получать актуальные данные
      // Это важно, так как plan_7 должен скрываться после первой покупки
      const { removeCache } = await import('@/lib/utils/cache');
      removeCache(CACHE_KEY);

      // Проверяем доступность Telegram WebApp
      const { checkTelegramWebApp } = await import('@/lib/telegram-fallback');
      const { isAvailable } = checkTelegramWebApp();
      
      if (!isAvailable) {
        setError('Telegram WebApp не доступен. Пожалуйста, откройте приложение через Telegram.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const tariffs = await api.getTariffs();
        
        // Валидация данных тарифов
        if (!Array.isArray(tariffs) || tariffs.length === 0) {
          throw new Error('Тарифы не найдены');
        }
        
        // Проверяем, есть ли у пользователя оплаченные платежи
        const hasPaidOrders = await checkHasPaidOrders();

        // Преобразуем тарифы с бэкенда в формат приложения с валидацией
        const transformedPlans: Plan[] = tariffs
          .filter((tariff) => {
            // Валидация: проверяем наличие обязательных полей
            if (!tariff || !tariff.id || typeof tariff.days !== 'number' || tariff.days <= 0 || !(tariff.price_rub || tariff.price_stars)) {
              return false;
            }
            
            // Скрываем plan_7, если у пользователя есть оплаченные платежи
            if (tariff.id === 'plan_7' && hasPaidOrders) {
              return false;
            }
            
            return true;
          })
          .map((tariff) => {
            // Используем ID с бэкенда напрямую
            const planId = tariff.id;
            
            // Используем цену в рублях с бэкенда
            const originalPrice = tariff.price_rub || tariff.price_stars || 0;
            
            // Применяем скидку, если она есть
            const discountPercent = discount?.percent || 0;
            const totalPrice = discountPercent > 0 
              ? applyDiscount(originalPrice, discountPercent)
              : originalPrice;
            
            const monthlyPrice = Math.round(totalPrice / (tariff.days / 30));
            
            return {
              id: planId,
              duration: getDurationFromDays(tariff.days),
              totalPrice,
              originalPrice: discountPercent > 0 ? originalPrice : undefined,
              monthlyPrice,
              days: tariff.days,
              isPopular: planId === 'plan_180' || tariff.days === 180, // 6 месяцев - популярный тариф
            };
          });

        // Проверяем, что после валидации остались тарифы
        if (transformedPlans.length === 0) {
          throw new Error('Нет валидных тарифов');
        }

        // Сортируем тарифы по продолжительности
        transformedPlans.sort((a, b) => {
          const order = ['plan_7', 'plan_30', 'plan_90', 'plan_180', 'plan_365'];
          const aIndex = order.indexOf(a.id);
          const bIndex = order.indexOf(b.id);
          // Если ID не в списке, ставим в конец
          if (aIndex === -1 && bIndex === -1) return a.days - b.days;
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        });

        setPlans(transformedPlans);
        
        // НЕ сохраняем в кэш, чтобы всегда проверять актуальное состояние
        // setCache(CACHE_KEY, transformedPlans, CACHE_TTL);
        
        // Устанавливаем выбранный тариф по умолчанию (6 месяцев)
        if (transformedPlans.length > 0) {
          const defaultPlan = transformedPlans.find(p => p.id === 'plan_180') || transformedPlans[0];
          setSelectedPlanId(defaultPlan.id);
        }
      } catch (err) {
        logError('Failed to load tariffs', err, {
          page: 'purchase',
          action: 'loadTariffs'
        });
        setError('Не удалось загрузить тарифы. Пожалуйста, попробуйте позже.');
        // Fallback на дефолтные тарифы при ошибке
        setPlans([
          { id: 'plan_30', duration: '1 месяц', totalPrice: 150, monthlyPrice: 150, days: 30 },
          { id: 'plan_90', duration: '3 месяца', totalPrice: 390, monthlyPrice: 130, days: 90 },
          { id: 'plan_180', duration: '6 месяцев', totalPrice: 720, monthlyPrice: 120, days: 180, isPopular: true },
          { id: 'plan_365', duration: '1 год', totalPrice: 1320, monthlyPrice: 110, days: 365 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadTariffs();
  }, [checkHasPaidOrders]);

  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0];

  return (
    <main className="w-full min-h-[var(--tg-viewport-height,100vh)] bg-black text-white pt-[calc(100px+env(safe-area-inset-top))] px-[calc(1rem+env(safe-area-inset-left))] font-sans select-none flex flex-col">
      {/* Header with Back Button */}
      <div className="sticky top-[calc(100px+env(safe-area-inset-top))] z-50 flex items-center justify-between w-fit mb-4">
        <Link href="/" className="p-2 bg-white/10 rounded-xl border border-white/10 active:scale-95 transition-all hover:bg-white/15">
          <ChevronLeft className="w-6 h-6" />
        </Link>
      </div>

      <div className="flex flex-col mb-8">
        <h1 className="text-2xl font-semibold px-1">Покупка подписки</h1>
      </div>

      {error && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-[10px] p-4 mb-4 text-yellow-500 text-sm">
          {error}
        </div>
      )}

      {/* 
        Инфо-блок об устройствах 
        На текущий момент количество устройств фиксировано (5 шт.)
      */}
      <div className="bg-[#121212] rounded-[16px] px-[14px] py-[14px] border border-white/5 mb-4 backdrop-blur-[7px] shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-[#F55128]/10 rounded-xl flex items-center justify-center text-lg font-bold text-[#F55128] border border-[#F55128]/20">
            {SUBSCRIPTION_CONFIG.DEFAULT_DEVICES_COUNT}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Устройств</h2>
            <p className="text-white/40 text-[11px] font-medium uppercase tracking-wider">Доступно одновременно</p>
          </div>
        </div>
      </div>

      {/* Сетка тарифных планов */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {plans.map((plan) => {
          const isSelected = selectedPlanId === plan.id;
          return (
            <button
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className={`relative px-[14px] py-[14px] rounded-[10px] border transition-all active:scale-[0.98] flex flex-col items-center justify-center text-center gap-1 focus:outline-none focus:ring-2 focus:ring-[#F55128]/50 ${
                isSelected 
                  ? 'bg-[#F55128]/15 border-[#F55128] shadow-[0_0_25px_rgba(245,81,40,0.15)]' 
                  : 'bg-[#121212] border-white/10 hover:bg-white/5'
              }`}
              aria-label={`Выбрать тариф ${plan.duration} за ${plan.totalPrice} рублей`}
              aria-pressed={isSelected}
              type="button"
            >
              {/* Бейдж "Популярный" для тарифа на 6 месяцев */}
              {plan.isPopular && (
                <div 
                  className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F55128] text-white text-[9px] font-bold py-1 px-3 rounded-full shadow-lg shadow-[#F55128]/30 uppercase tracking-widest z-10"
                  aria-label="Популярный тариф"
                >
                  Популярный
                </div>
              )}
              
              <span className={`text-[10px] uppercase tracking-[0.1em] font-medium mb-1 ${isSelected ? 'text-[#F55128]' : 'text-white/40'}`}>
                {plan.duration}
              </span>
              
              <div className="flex flex-col items-center">
                {plan.originalPrice && plan.originalPrice > plan.totalPrice ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-white">
                        {plan.totalPrice} ₽
                      </span>
                      <span className="text-sm text-white/40 line-through">
                        {plan.originalPrice} ₽
                      </span>
                    </div>
                    {discount && discount.percent > 0 && (
                      <div className="text-[10px] font-bold text-green-500 mt-0.5">
                        -{discount.percent}%
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-xl font-bold text-white">
                    {plan.totalPrice} ₽
                  </span>
                )}
                {plan.id !== '1m' && plan.id !== 'plan_7' && (
                  <div className={`text-[10px] font-medium mt-1.5 px-2 py-0.5 rounded-lg transition-colors ${
                    isSelected ? 'bg-[#F55128]/20 text-[#F55128]' : 'bg-white/5 text-white/40'
                  }`}>
                    {plan.monthlyPrice} ₽ / мес
                  </div>
                )}
              </div>
            </button>
          );
        })}
        </div>
      )}

      {/* Кнопка оплаты, вызывающая модальное окно подтверждения */}
      {selectedPlan && (
        <div className="mt-auto">
          <button 
            onClick={() => setIsConfirmOpen(true)}
            disabled={loading || !selectedPlan}
            className="w-full bg-[#F55128] hover:bg-[#d43d1f] active:scale-[0.98] transition-all rounded-[10px] py-[14px] flex items-center justify-center gap-3 group shadow-lg shadow-[#F55128]/20 focus:outline-none focus:ring-2 focus:ring-[#F55128]/50 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Продолжить оформление подписки за ${selectedPlan?.totalPrice || 0} рублей`}
            type="button"
          >
            <span className="text-base font-bold text-white">
              Продолжить за {selectedPlan?.totalPrice || 0} ₽
            </span>
            {selectedPlan?.originalPrice && selectedPlan.originalPrice > (selectedPlan?.totalPrice || 0) && (
              <span className="text-sm font-medium text-white/40 line-through">
                {selectedPlan.originalPrice} ₽
              </span>
            )}
            {selectedPlan?.oldPrice && !selectedPlan?.originalPrice && (
              <span className="text-sm font-medium text-white/40 line-through">
                {selectedPlan.oldPrice} ₽
              </span>
            )}
          </button>
        </div>
      )}

      {/* Bottom Spacer - ensure space for Telegram UI or safe areas */}
      <div className="min-h-[calc(1rem+env(safe-area-inset-bottom))] w-full" aria-hidden="true" />

      {selectedPlan && isConfirmOpen && (
        <Suspense fallback={null}>
          <PurchaseConfirmModal 
            isOpen={isConfirmOpen}
            onClose={() => setIsConfirmOpen(false)}
            planId={selectedPlan.id}
            price={selectedPlan.totalPrice}
            duration={selectedPlan.duration}
            devices={SUBSCRIPTION_CONFIG.DEFAULT_DEVICES_COUNT}
            untilDate={calculateUntilDate(selectedPlan.days, subscription?.expiresAt)}
          />
        </Suspense>
      )}
    </main>
  );
}

