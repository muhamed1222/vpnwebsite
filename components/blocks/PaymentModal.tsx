'use client';

import React from 'react';
import { CreditCard } from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Компонент PaymentModal
 * Отображает управление способами оплаты и автопродлением в формате BottomSheet.
 */
export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose }) => {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Оплата">
      <div className="flex flex-col">
        {/* 
          Карточка пустого состояния 
          Анимируется с задержкой через --index
        */}
        <div 
          className="bg-white/5 rounded-[16px] p-10 flex flex-col items-center justify-center border border-white/5 mb-6 text-center css-dialog_content-item"
          style={{ '--index': 1 } as React.CSSProperties}
        >
          <div className="bg-white/5 p-4 rounded-xl mb-4 border border-white/5">
            <CreditCard size={32} className="text-white/60" />
          </div>
          <p className="text-white/80 text-lg font-medium leading-relaxed max-w-[280px]">
            У вас еще нет добавленных способов оплаты
          </p>
        </div>

        {/* 
          Кнопка управления автопродлением 
          Анимируется с задержкой через --index
        */}
        <button 
          className="w-full bg-[#F55128]/10 hover:bg-[#F55128]/20 active:scale-[0.98] transition-all border border-[#F55128]/20 rounded-[10px] p-5 flex items-center justify-center mb-4 css-dialog_content-item"
          style={{ '--index': 2 } as React.CSSProperties}
        >
          <span className="text-lg font-medium text-[#F55128]">Включить автопродление</span>
        </button>

        <p 
          className="text-white/40 text-sm text-center px-4 css-dialog_content-item"
          style={{ '--index': 3 } as React.CSSProperties}
        >
          Автопродление позволяет не беспокоиться о своевременной оплате подписки
        </p>
      </div>
    </BottomSheet>
  );
};

