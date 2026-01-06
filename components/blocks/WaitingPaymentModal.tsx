'use client';

import React from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';

interface WaitingPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRedirect: () => void;
}

/**
 * Компонент WaitingPaymentModal
 * Отображает состояние ожидания перед переходом на платежный шлюз.
 * Переведен на использование универсального BottomSheet.
 */
export const WaitingPaymentModal: React.FC<WaitingPaymentModalProps> = ({ 
  isOpen, 
  onClose,
  onRedirect
}) => {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Ожидание оплаты">
      <div className="flex flex-col items-center">
        {/* Подзаголовок */}
        <div 
          className="flex items-center gap-2 mb-12 css-dialog_content-item"
          style={{ '--index': 1 } as React.CSSProperties}
        >
          <p className="text-white/80 text-lg font-medium">Оплатите счет в сервисе ЮKасса</p>
          <ExternalLink size={18} className="text-white/40" />
        </div>

        {/* Анимация загрузки */}
        <div 
          className="flex justify-center mb-12 css-dialog_content-item"
          style={{ '--index': 2 } as React.CSSProperties}
        >
          <Loader2 size={64} className="text-[#F55128] animate-spin" />
        </div>

        {/* Кнопка перехода */}
        <div 
          className="w-full css-dialog_content-item"
          style={{ '--index': 3 } as React.CSSProperties}
        >
            <button 
              onClick={onRedirect}
              className="w-full bg-[#F55128] hover:bg-[#d43d1f] active:scale-[0.98] transition-all rounded-[10px] py-[14px] text-base font-bold text-white shadow-lg shadow-[#F55128]/20"
            >
            Перейти на форму оплаты
          </button>
        </div>

        {/* Информационная подпись */}
        <p 
          className="mt-6 text-center text-white/30 text-sm css-dialog_content-item"
          style={{ '--index': 4 } as React.CSSProperties}
        >
          Перенаправление произойдет автоматически
        </p>
      </div>
    </BottomSheet>
  );
};
