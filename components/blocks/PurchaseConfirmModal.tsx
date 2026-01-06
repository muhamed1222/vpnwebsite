'use client';

import React, { useState } from 'react';
import { Plus, ChevronRight, Loader2 } from 'lucide-react';
import { PaymentMethodsModal } from './PaymentMethodsModal';
import { WaitingPaymentModal } from './WaitingPaymentModal';
import { getTelegramWebApp } from '@/lib/telegram';
import { BottomSheet } from '../ui/BottomSheet';

interface PurchaseConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  price: number;
  duration: string;
  devices: number;
  untilDate: string;
}

/**
 * Компонент PurchaseConfirmModal
 * Отображает детали заказа и позволяет выбрать способ оплаты перед переходом на платежный шлюз.
 * Переведен на использование универсального BottomSheet.
 */
export const PurchaseConfirmModal: React.FC<PurchaseConfirmModalProps> = ({ 
  isOpen, 
  onClose,
  price,
  duration,
  devices,
  untilDate 
}) => {
  const [isMethodsOpen, setIsMethodsOpen] = useState(false);
  const [isWaitingOpen, setIsWaitingOpen] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayClick = async () => {
    setIsProcessing(true);
    setIsWaitingOpen(true);
    
    try {
      // Имитация задержки перед редиректом
      await new Promise(resolve => setTimeout(resolve, 2000));
      handleRedirect();
    } catch (error) {
      console.error('Payment processing error:', error);
      setIsProcessing(false);
      setIsWaitingOpen(false);
    }
  };

  const handleRedirect = () => {
    const paymentUrl = 'https://yookassa.ru/checkout/...'; // Реальная ссылка будет тут
    const webApp = getTelegramWebApp();
    if (webApp) {
      webApp.openLink(paymentUrl);
    } else {
      window.open(paymentUrl, '_blank');
    }
  };

  const currentMethod = {
    card: 'Оплата новой картой',
    sbp: 'Оплата новым счетом СБП',
    sberpay: 'Оплата новым SberPay',
  }[selectedMethodId as 'card' | 'sbp' | 'sberpay'];

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose} title="Подтверждение">
        <div className="flex flex-col">
          {/* Детали заказа */}
            <div 
              className="bg-white/5 rounded-[24px] p-5 border border-white/5 mb-6 space-y-4 css-dialog_content-item"
              style={{ '--index': 1 } as React.CSSProperties}
            >
            <div className="space-y-1">
              <p className="text-white/90 text-base font-medium leading-snug">
                Подписка до {untilDate}, {duration}
              </p>
              <div className="h-px bg-white/5 w-full my-3" />
              <p className="text-white/90 text-base font-medium">
                Количество устройств: {devices}
              </p>
            </div>
          </div>

          {/* Выбор способа оплаты */}
          <div 
            className="css-dialog_content-item"
            style={{ '--index': 2 } as React.CSSProperties}
          >
            <div 
              onClick={() => setIsMethodsOpen(true)}
              className="bg-white/5 rounded-[24px] p-4 border border-white/5 mb-6 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                  {selectedMethodId === 'card' ? (
                    <Plus size={24} className="text-white/60" />
                  ) : (
                    <div className="text-[10px] font-medium text-white uppercase">
                      {selectedMethodId}
                    </div>
                  )}
                </div>
                <span className="text-base font-medium text-white">{currentMethod}</span>
              </div>
              <button className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl px-4 py-2 flex items-center gap-1 transition-colors">
                <span className="text-sm font-medium text-white/80">Изменить</span>
                <ChevronRight size={16} className="text-white/40" />
              </button>
            </div>
          </div>

          {/* Кнопка оплаты */}
          <div 
            className="css-dialog_content-item"
            style={{ '--index': 3 } as React.CSSProperties}
          >
            <button 
              onClick={handlePayClick}
              disabled={isProcessing}
              className="w-full bg-[#F55128] hover:bg-[#d43d1f] active:scale-[0.98] transition-all rounded-2xl py-5 text-lg font-bold text-white shadow-lg shadow-[#F55128]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Обработка...</span>
                </>
              ) : (
                `Оплатить ${price} ₽`
              )}
            </button>
          </div>
        </div>
      </BottomSheet>

      <PaymentMethodsModal 
        isOpen={isMethodsOpen}
        onClose={() => setIsMethodsOpen(false)}
        selectedMethod={selectedMethodId}
        onSelect={setSelectedMethodId}
      />

      <WaitingPaymentModal 
        isOpen={isWaitingOpen}
        onClose={() => setIsWaitingOpen(false)}
        onRedirect={handleRedirect}
      />
    </>
  );
};
