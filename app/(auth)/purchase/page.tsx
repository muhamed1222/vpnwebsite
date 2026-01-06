'use client';

import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { PurchaseConfirmModal } from '@/components/blocks/PurchaseConfirmModal';
import { SUBSCRIPTION_CONFIG } from '@/lib/constants';

interface Plan {
  id: string;
  duration: string;
  totalPrice: number;
  monthlyPrice: number;
  isPopular?: boolean;
  oldPrice?: number;
}

const PLANS: Plan[] = [
  { id: '1m', duration: '1 месяц', totalPrice: 150, monthlyPrice: 150 },
  { id: '3m', duration: '3 месяца', totalPrice: 390, monthlyPrice: 130 },
  { id: '6m', duration: '6 месяцев', totalPrice: 720, monthlyPrice: 120, isPopular: true, oldPrice: 900 },
  { id: '1y', duration: '1 год', totalPrice: 1320, monthlyPrice: 110 },
];

export default function PurchasePage() {
  // Выбранный ID тарифного плана (по умолчанию 6 месяцев)
  const [selectedPlanId, setSelectedPlanId] = useState('6m');
  // Состояние модального окна подтверждения
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const selectedPlan = PLANS.find(p => p.id === selectedPlanId) || PLANS[2];

  return (
    <main className="min-h-screen bg-black text-white p-4 font-sans select-none flex flex-col">
      {/* Шапка с кнопкой назад */}
      <div className="flex items-center mb-6 pt-2">
        <Link href="/" className="p-2 bg-white/5 rounded-xl border border-white/5 active:scale-90 transition-transform">
          <ChevronLeft size={24} />
        </Link>
      </div>

      <h1 className="text-2xl font-medium mb-6 px-2">Покупка подписки</h1>

      {/* 
        Инфо-блок об устройствах 
        На текущий момент количество устройств фиксировано (5 шт.)
      */}
      <div className="bg-[#121212] rounded-[16px] p-6 border border-white/10 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center text-3xl font-bold text-[#F55128]">
            {SUBSCRIPTION_CONFIG.DEFAULT_DEVICES_COUNT}
          </div>
          <div>
            <h2 className="text-xl font-bold">Устройств</h2>
            <p className="text-white/40 text-sm font-medium">Доступно одновременно в подписке</p>
          </div>
        </div>
      </div>

      {/* Сетка тарифных планов */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {PLANS.map((plan) => {
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
              
              <span className={`text-[11px] uppercase tracking-[0.1em] font-medium mb-1 ${isSelected ? 'text-[#F55128]' : 'text-white/40'}`}>
                {plan.duration}
              </span>
              
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-white">
                  {plan.totalPrice} ₽
                </span>
                {plan.id !== '1m' && (
                  <div className={`text-[11px] font-medium mt-1.5 px-2 py-0.5 rounded-lg transition-colors ${
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

      <div className="flex-1" />

      {/* Кнопка оплаты, вызывающая модальное окно подтверждения */}
      <button 
        onClick={() => setIsConfirmOpen(true)}
        className="w-full bg-[#F55128] hover:bg-[#d43d1f] active:scale-[0.98] transition-all rounded-[10px] p-5 flex items-center justify-center gap-3 group shadow-lg shadow-[#F55128]/20 focus:outline-none focus:ring-2 focus:ring-[#F55128]/50"
        aria-label={`Продолжить оформление подписки за ${selectedPlan.totalPrice} рублей`}
        type="button"
      >
        <span className="text-lg font-bold text-white">
          Продолжить за {selectedPlan.totalPrice} ₽
        </span>
        {selectedPlan.oldPrice && (
          <span className="text-base font-medium text-white/40 line-through">
            {selectedPlan.oldPrice} ₽
          </span>
        )}
      </button>
      <div className="h-4" />

      <PurchaseConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        price={selectedPlan.totalPrice}
        duration={selectedPlan.duration}
        devices={SUBSCRIPTION_CONFIG.DEFAULT_DEVICES_COUNT}
        untilDate="6 февраля 2026"
      />
    </main>
  );
}

