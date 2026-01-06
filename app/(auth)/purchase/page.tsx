'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { PurchaseConfirmModal } from '@/components/blocks/PurchaseConfirmModal';
import { SUBSCRIPTION_CONFIG } from '@/lib/constants';
import { api } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface Plan {
  id: string;
  duration: string;
  totalPrice: number;
  monthlyPrice: number;
  isPopular?: boolean;
  oldPrice?: number;
}

// Маппинг ID тарифов с бэкенда на локализованные названия
const PLAN_DURATION_MAP: Record<string, string> = {
  '1m': '1 месяц',
  '3m': '3 месяца',
  '6m': '6 месяцев',
  '1y': '1 год',
};

// Конвертация дней в локализованное название
const getDurationFromDays = (days: number): string => {
  if (days === 7) return '7 дней (Тест)';
  if (days === 30) return '1 месяц';
  if (days === 90) return '3 месяца';
  if (days === 180) return '6 месяцев';
  if (days === 365) return '1 год';
  return `${days} дней`;
};

export default function PurchasePage() {
  // Выбранный ID тарифного плана (по умолчанию 6 месяцев)
  const [selectedPlanId, setSelectedPlanId] = useState('6m');
  // Состояние модального окна подтверждения
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  // Тарифы с бэкенда
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загружаем тарифы с бэкенда
  useEffect(() => {
    const loadTariffs = async () => {
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
        
        // Преобразуем тарифы с бэкенда в формат приложения
        const transformedPlans: Plan[] = tariffs.map((tariff) => {
          // Используем ID с бэкенда напрямую, или определяем по количеству дней
          let planId = tariff.id;
          if (!planId || !['1m', '3m', '6m', '1y'].includes(planId)) {
            // Определяем ID тарифа по количеству дней, если ID не подходит
            if (tariff.days === 30 || tariff.days === 28 || tariff.days === 31) planId = '1m';
            else if (tariff.days === 90 || tariff.days === 84 || tariff.days === 93) planId = '3m';
            else if (tariff.days === 180 || tariff.days === 183) planId = '6m';
            else if (tariff.days === 365 || tariff.days === 366) planId = '1y';
            else planId = tariff.id; // Используем оригинальный ID если не распознали
          }
          
          // Используем цену в рублях с бэкенда
          const totalPrice = tariff.price_rub || tariff.price_stars;
          const monthlyPrice = Math.round(totalPrice / (tariff.days / 30));
          
          return {
            id: planId,
            duration: getDurationFromDays(tariff.days),
            totalPrice,
            monthlyPrice,
            isPopular: planId === '6m' || tariff.days === 180, // 6 месяцев - популярный тариф
          };
        });

        // Сортируем тарифы по продолжительности
        transformedPlans.sort((a, b) => {
          const order = ['plan_7', '1m', '3m', '6m', '1y'];
          return order.indexOf(a.id) - order.indexOf(b.id);
        });

        setPlans(transformedPlans);
        
        // Устанавливаем выбранный тариф по умолчанию (6 месяцев)
        if (transformedPlans.length > 0) {
          const defaultPlan = transformedPlans.find(p => p.id === '6m') || transformedPlans[0];
          setSelectedPlanId(defaultPlan.id);
        }
      } catch (err) {
        console.error('Failed to load tariffs:', err);
        setError('Не удалось загрузить тарифы. Пожалуйста, попробуйте позже.');
        // Fallback на дефолтные тарифы при ошибке
        setPlans([
          { id: '1m', duration: '1 месяц', totalPrice: 150, monthlyPrice: 150 },
          { id: '3m', duration: '3 месяца', totalPrice: 390, monthlyPrice: 130 },
          { id: '6m', duration: '6 месяцев', totalPrice: 720, monthlyPrice: 120, isPopular: true },
          { id: '1y', duration: '1 год', totalPrice: 1320, monthlyPrice: 110 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadTariffs();
  }, []);

  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0];

  return (
    <main className="min-h-screen bg-black text-white p-4 font-sans select-none flex flex-col">
      {/* Шапка с кнопкой назад */}
      <div className="flex items-center mb-6 pt-2">
        <Link href="/" className="p-2 bg-white/5 rounded-xl border border-white/5 active:scale-90 transition-transform">
          <ChevronLeft size={24} />
        </Link>
      </div>

      <h1 className="text-xl font-medium mb-6 px-2">Покупка подписки</h1>

      {error && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-[10px] p-4 mb-4 text-yellow-500 text-sm">
          {error}
        </div>
      )}

      {/* 
        Инфо-блок об устройствах 
        На текущий момент количество устройств фиксировано (5 шт.)
      */}
      <div className="bg-[#121212] rounded-[16px] p-6 border border-white/10 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center text-2xl font-bold text-[#F55128]">
            {SUBSCRIPTION_CONFIG.DEFAULT_DEVICES_COUNT}
          </div>
          <div>
            <h2 className="text-lg font-bold">Устройств</h2>
            <p className="text-white/40 text-xs font-medium">Доступно одновременно в подписке</p>
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
              className={`relative p-5 rounded-[16px] border transition-all active:scale-[0.98] flex flex-col items-center justify-center text-center gap-1 focus:outline-none focus:ring-2 focus:ring-[#F55128]/50 ${
                isSelected 
                  ? 'bg-[#F55128]/15 border-[#F55128] shadow-[0_0_25px_rgba(245,81,40,0.15)]' 
                  : 'bg-[#121212] border-white/10 hover:border-white/20'
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
                <span className="text-xl font-bold text-white">
                  {plan.totalPrice} ₽
                </span>
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

      <div className="flex-1" />

      {/* Кнопка оплаты, вызывающая модальное окно подтверждения */}
      {selectedPlan && (
        <>
          <button 
            onClick={() => setIsConfirmOpen(true)}
            disabled={loading || !selectedPlan}
            className="w-full bg-[#F55128] hover:bg-[#d43d1f] active:scale-[0.98] transition-all rounded-[10px] p-5 flex items-center justify-center gap-3 group shadow-lg shadow-[#F55128]/20 focus:outline-none focus:ring-2 focus:ring-[#F55128]/50 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Продолжить оформление подписки за ${selectedPlan?.totalPrice || 0} рублей`}
            type="button"
          >
            <span className="text-base font-bold text-white">
              Продолжить за {selectedPlan?.totalPrice || 0} ₽
            </span>
            {selectedPlan?.oldPrice && (
              <span className="text-sm font-medium text-white/40 line-through">
                {selectedPlan.oldPrice} ₽
              </span>
            )}
          </button>
        </>
      )}
      <div className="h-4" />

      {selectedPlan && (
        <PurchaseConfirmModal 
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          price={selectedPlan.totalPrice}
          duration={selectedPlan.duration}
          devices={SUBSCRIPTION_CONFIG.DEFAULT_DEVICES_COUNT}
          untilDate="6 февраля 2026"
        />
      )}
    </main>
  );
}

