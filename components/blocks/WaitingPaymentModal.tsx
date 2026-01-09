'use client';

import React from 'react';
import { ArrowTopRightOnSquareIcon as ExternalLink, ArrowPathIcon as Loader2, CheckCircleIcon as CheckCircle2 } from '@heroicons/react/24/outline';
import { BottomSheet } from '../ui/BottomSheet';

interface WaitingPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRedirect: () => void;
  isPaid?: boolean;
}

/**
 * Компонент WaitingPaymentModal
 * Отображает состояние ожидания перед переходом на платежный шлюз.
 * Переведен на использование универсального BottomSheet.
 */
export const WaitingPaymentModal: React.FC<WaitingPaymentModalProps> = ({ 
  isOpen, 
  onClose,
  onRedirect,
  isPaid = false
}) => {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={isPaid ? "Оплата получена" : "Ожидание оплаты"}>
      <div className="flex flex-col items-center">
        {isPaid ? (
          <>
            {/* Иконка успеха */}
            <div 
              className="flex justify-center mb-6 css-dialog_content-item"
              style={{ '--index': 1 } as React.CSSProperties}
            >
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                <CheckCircle2 size={48} className="text-green-500" />
              </div>
            </div>

            <div 
              className="flex flex-col items-center gap-2 mb-12 css-dialog_content-item text-center"
              style={{ '--index': 2 } as React.CSSProperties}
            >
              <p className="text-white text-xl font-bold">Подписка активирована!</p>
              <p className="text-white/60 text-sm">Теперь вы можете использовать все преимущества VPN</p>
            </div>

            {/* Кнопка закрытия */}
            <div 
              className="w-full css-dialog_content-item"
              style={{ '--index': 3 } as React.CSSProperties}
            >
                <button 
                  onClick={onClose}
                  className="w-full bg-green-600 hover:bg-green-700 active:scale-[0.98] transition-all rounded-[10px] py-[14px] text-base font-bold text-white shadow-lg shadow-green-900/20"
                >
                Отлично
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Подзаголовок */}
            <div 
              className="flex items-center gap-2 mb-12 css-dialog_content-item"
              style={{ '--index': 1 } as React.CSSProperties}
            >
              <p className="text-white/80 text-lg font-medium">Оплатите счет в сервисе ЮKасса</p>
              <ExternalLink className="w-[18px] h-[18px]" className="text-white/40" />
            </div>

            {/* Анимация загрузки */}
            <div 
              className="flex justify-center mb-12 css-dialog_content-item"
              style={{ '--index': 2 } as React.CSSProperties}
            >
              <Loader2 className="w-16 h-16 text-[#F55128] animate-spin" />
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
          </>
        )}
      </div>
    </BottomSheet>
  );
};
