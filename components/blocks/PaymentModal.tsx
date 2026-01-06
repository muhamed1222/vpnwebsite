'use client';

import React from 'react';
import { CreditCard, ShieldCheck, ShieldAlert } from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';
import { useSubscriptionStore } from '@/store/subscription.store';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Компонент PaymentModal
 * Отображает управление способами оплаты и автопродлением в формате BottomSheet.
 */
export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose }) => {
  const { subscription } = useSubscriptionStore();
  const isActive = subscription?.status === 'active';

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Оплата">
      <div className="flex flex-col h-full">
        {/* 1. Карточка статуса подписки */}
        <div 
          className="bg-white/5 rounded-[16px] p-6 flex items-center gap-4 border border-white/5 mb-6 css-dialog_content-item"
          style={{ '--index': 1 } as React.CSSProperties}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isActive ? 'bg-green-500/10 border border-green-500/20' : 'bg-yellow-500/10 border border-yellow-500/20'}`}>
            {isActive ? (
              <ShieldCheck size={24} className="text-green-500" />
            ) : (
              <ShieldAlert size={24} className="text-yellow-500" />
            )}
          </div>
          <div>
            <h3 className="text-white font-medium text-lg">
              {isActive ? 'Подписка активна' : 'Подписка не активна'}
            </h3>
            <p className="text-white/40 text-sm">
              {isActive ? `До ${subscription?.expiresAt || '...'}` : 'Требуется продление'}
            </p>
          </div>
        </div>

        {/* 2. Карточка способов оплаты */}
        <div 
          className="bg-white/5 rounded-[16px] p-10 flex flex-col items-center justify-center border border-white/5 mb-6 text-center css-dialog_content-item"
          style={{ '--index': 2 } as React.CSSProperties}
        >
          <div className="bg-white/5 p-4 rounded-xl mb-4 border border-white/5">
            <CreditCard size={32} className="text-white/60" />
          </div>
          <p className="text-white/80 text-lg font-medium leading-relaxed max-w-[280px]">
            Способы оплаты сохраняются автоматически при первой покупке
          </p>
        </div>

        {/* 3. Кнопка управления автопродлением */}
        <button 
          className="w-full bg-[#F55128]/10 hover:bg-[#F55128]/20 active:scale-[0.98] transition-all border border-[#F55128]/20 rounded-[10px] p-5 flex items-center justify-center mb-4 css-dialog_content-item"
          style={{ '--index': 3 } as React.CSSProperties}
          onClick={() => {
            // В будущем здесь будет вызов API для включения автопродления
            const webApp = (window as any).Telegram?.WebApp;
            if (webApp) {
              webApp.showAlert('Управление автопродлением будет доступно в ближайшем обновлении');
            }
          }}
        >
          <span className="text-lg font-medium text-[#F55128]">Включить автопродление</span>
        </button>

        <p 
          className="text-white/40 text-sm text-center px-4 css-dialog_content-item"
          style={{ '--index': 4 } as React.CSSProperties}
        >
          Автопродление позволяет не беспокоиться о своевременной оплате подписки
        </p>
      </div>
    </BottomSheet>
  );
};

