'use client';

import React, { useState } from 'react';
import { Plus, ChevronRight, Loader2, Calendar, Monitor, CreditCard } from 'lucide-react';
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

  const getMethodInfo = () => {
    switch (selectedMethodId) {
      case 'card': return { name: 'Банковская карта', icon: <CreditCard size={18} /> };
      case 'sbp': return { name: 'СБП', icon: <div className="font-bold text-[9px]">СБП</div> };
      case 'sberpay': return { name: 'SberPay', icon: <div className="font-bold text-[9px]">Sber</div> };
      default: return { name: 'Способ оплаты', icon: <Plus size={18} /> };
    }
  };

  const methodInfo = getMethodInfo();

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose} title="Подтверждение">
        <div className="flex flex-col pb-4">
          {/* Детали заказа */}
          <div 
            className="bg-white/[0.03] rounded-[16px] px-[14px] py-[14px] border border-white/5 mb-4 space-y-4 css-dialog_content-item"
            style={{ '--index': 1 } as React.CSSProperties}
          >
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 bg-[#F55128]/10 rounded-xl flex items-center justify-center border border-[#F55128]/20 text-[#F55128]">
                <Calendar size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-white/40 text-[11px] font-medium uppercase tracking-wider">Срок подписки</span>
                <span className="text-white text-base font-semibold">До {untilDate} ({duration})</span>
              </div>
            </div>

            <div className="h-px bg-white/5 w-full" />

            <div className="flex items-center gap-4">
              <div className="w-9 h-9 bg-[#F55128]/10 rounded-xl flex items-center justify-center border border-[#F55128]/20 text-[#F55128]">
                <Monitor size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-white/40 text-[11px] font-medium uppercase tracking-wider">Устройства</span>
                <span className="text-white text-base font-semibold">{devices} одновременно</span>
              </div>
            </div>
          </div>

          {/* Выбор способа оплаты */}
          <div 
            className="css-dialog_content-item"
            style={{ '--index': 2 } as React.CSSProperties}
          >
            <div 
              onClick={() => setIsMethodsOpen(true)}
              className="bg-white/5 rounded-[10px] px-[14px] py-[14px] border border-white/5 mb-6 flex items-center justify-between group cursor-pointer hover:bg-white/10 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 text-white/60 group-hover:text-white transition-colors">
                  {methodInfo.icon}
                </div>
                <div className="flex flex-col">
                  <span className="text-white/40 text-[11px] font-medium uppercase tracking-wider">Способ оплаты</span>
                  <span className="text-white text-base font-semibold">{methodInfo.name}</span>
                </div>
              </div>
              <div className="bg-white/5 p-2 rounded-full text-white/20 group-hover:text-white/60 transition-colors">
                <ChevronRight size={18} />
              </div>
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
              className="w-full bg-[#F55128] hover:bg-[#d43d1f] active:scale-[0.98] transition-all rounded-[10px] py-[14px] text-base font-bold text-white shadow-lg shadow-[#F55128]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
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
