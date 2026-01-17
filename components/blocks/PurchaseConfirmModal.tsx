'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PlusIcon as Plus, ChevronRightIcon as ChevronRight, ArrowPathIcon as Loader2, CalendarIcon as Calendar, ComputerDesktopIcon as Monitor, CreditCardIcon as CreditCard } from '@heroicons/react/24/outline';
import { PaymentMethodsModal } from './PaymentMethodsModal';
import { WaitingPaymentModal } from './WaitingPaymentModal';
import { BottomSheet } from '../ui/BottomSheet';
import { api } from '@/lib/api';
import { login } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useTelegramAlert } from '@/hooks/useTelegramAlert';
import { useTelegramLink } from '@/hooks/useTelegramAlert';
import { logError } from '@/lib/utils/logging';
import { DELAYS } from '@/lib/constants';

interface PurchaseConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
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
  planId,
  price,
  duration,
  devices,
  untilDate 
}) => {
  const router = useRouter();
  const showAlert = useTelegramAlert();
  const openLink = useTelegramLink();
  const [isMethodsOpen, setIsMethodsOpen] = useState(false);
  const [isWaitingOpen, setIsWaitingOpen] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollAttemptsRef = useRef(0);

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => stopPolling();
  }, []);

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const startPolling = () => {
    stopPolling();
    pollAttemptsRef.current = 0;
    
    pollIntervalRef.current = setInterval(async () => {
      pollAttemptsRef.current += 1;
      
      try {
        // Сначала пробуем проверить статус оплаты через API
        if (orderId) {
          try {
            const paymentResult = await api.checkPaymentSuccess(orderId);
            
            if (paymentResult.status === 'completed') {
              // Оплата прошла и подписка активирована
              setIsPaid(true);
              stopPolling();
              
              // Обновляем данные пользователя
              await login(true);
              
              // Через DELAYS.POLLING_RESET секунд закрываем все и уходим на главную
              setTimeout(() => {
                setIsWaitingOpen(false);
                onClose();
                router.push('/');
              }, DELAYS.POLLING_RESET);
              return;
            }
          } catch (e) {
            // Если не удалось проверить через API, продолжаем polling через login
            logError('Payment check error', e, {
              page: 'purchase',
              action: 'checkPaymentSuccess',
              orderId,
              pollAttempt: pollAttemptsRef.current
            });
          }
        }
        
        // Fallback: проверяем через login (старый способ)
        const result = await login(true); // Тихий логин для проверки статуса
        if (result.success) {
          // Проверяем статус через стор (login уже обновил его)
          const { useSubscriptionStore } = await import('@/store/subscription.store');
          const sub = useSubscriptionStore.getState().subscription;
          
          if (sub?.status === 'active') {
            setIsPaid(true);
            stopPolling();
            
            // Через DELAYS.POLLING_RESET секунд закрываем все и уходим на главную
            setTimeout(() => {
              setIsWaitingOpen(false);
              onClose();
              router.push('/');
            }, DELAYS.POLLING_RESET);
          }
        }
      } catch (e) {
        logError('Polling error', e, {
          page: 'purchase',
          action: 'pollPaymentStatus',
          planId,
          pollAttempt: pollAttemptsRef.current
        });
      }

      if (pollAttemptsRef.current >= DELAYS.MAX_POLL_ATTEMPTS) {
        stopPolling();
      }
    }, DELAYS.POLLING_INTERVAL);
  };

  const handlePayClick = async () => {
    // Дополнительная проверка: если пользователь пытается купить plan_7, проверяем историю платежей
    if (planId === 'plan_7') {
      setIsProcessing(true);
      try {
        const payments = await api.getPaymentsHistory();
        const hasPaidOrders = payments.some(p => p.status === 'success');
        
        if (hasPaidOrders) {
          setIsProcessing(false);
          showAlert('Пробная подписка доступна только один раз. Выберите другой тариф.');
          return;
        }
      } catch (error) {
        // Если не удалось проверить, продолжаем (бэкенд тоже проверит)
        const { logError } = await import('@/lib/utils/logging');
        logError('Failed to check payment history', error, {
          page: 'PurchaseConfirmModal',
          action: 'checkPaymentHistory'
        });
        // Продолжаем процесс оплаты, бэкенд тоже проверит
      }
    }

    setIsProcessing(true);
    
    try {
      // 1. Создаем реальный заказ через API с выбранным способом оплаты
      const response = await api.createOrder(planId, selectedMethodId);
      
      if (response && response.paymentUrl) {
        setPaymentUrl(response.paymentUrl);
        setOrderId(response.orderId); // Сохраняем orderId для проверки оплаты
        setIsWaitingOpen(true);
        
        // 2. Начинаем поллинг статуса в фоне
        startPolling();
        
        // 3. Делаем небольшую задержку для плавности и редиректим
        setTimeout(() => {
          handleRedirect(response.paymentUrl);
        }, DELAYS.PAYMENT_REDIRECT);
      } else {
        throw new Error('Не удалось получить ссылку на оплату');
      }
    } catch (error: unknown) {
      logError('Payment processing error', error, {
        page: 'purchase',
        action: 'createOrder',
        planId,
        price
      });
      // Преобразуем техническое сообщение в понятное для пользователя
      const { getUserFriendlyMessage } = await import('@/lib/utils/user-messages');
      const message = error instanceof Error 
        ? getUserFriendlyMessage(error.message)
        : 'Произошла ошибка при создании платежа. Попробуйте позже.';
      
      showAlert(message);
      setIsProcessing(false);
    }
  };

  const handleRedirect = (url?: string) => {
    const targetUrl = url || paymentUrl;
    if (!targetUrl) return;

    openLink(targetUrl);
  };

  const getMethodInfo = () => {
    switch (selectedMethodId) {
      case 'card': return { name: 'Банковская карта', icon: <CreditCard className="w-[18px] h-[18px]" /> };
      case 'sbp': return { name: 'СБП', icon: <div className="font-bold text-[9px]">СБП</div> };
      case 'sberpay': return { name: 'SberPay', icon: <div className="font-bold text-[9px]">Sber</div> };
      default: return { name: 'Способ оплаты', icon: <Plus className="w-[18px] h-[18px]" /> };
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
                <Calendar className="w-[18px] h-[18px]" />
              </div>
              <div className="flex flex-col">
                <span className="text-white/40 text-[11px] font-medium uppercase tracking-wider">Срок подписки</span>
                <span className="text-white text-base font-semibold">До {untilDate} ({duration})</span>
              </div>
            </div>

            <div className="h-px bg-white/5 w-full" />

            <div className="flex items-center gap-4">
              <div className="w-9 h-9 bg-[#F55128]/10 rounded-xl flex items-center justify-center border border-[#F55128]/20 text-[#F55128]">
                <Monitor className="w-[18px] h-[18px]" />
              </div>
              <div className="flex flex-col">
                <span className="text-white/40 text-[11px] font-medium uppercase tracking-wider">Устройства</span>
                <span className="text-white text-base font-semibold">{devices} одновременно</span>
              </div>
            </div>
          </div>

          {/* Кнопка выбора способа оплаты */}
          <div 
            className="css-dialog_content-item mb-3"
            style={{ '--index': 2 } as React.CSSProperties}
          >
            <button 
              onClick={() => setIsMethodsOpen(true)}
              disabled={isProcessing}
              className="w-full bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all border border-white/10 rounded-[10px] py-[14px] px-[14px] flex items-center justify-between text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                {methodInfo.icon}
                <span className="text-base font-medium">{methodInfo.name}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-white/40" />
            </button>
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
                  <Loader2 className="w-6 h-6 animate-spin" />
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
        isPaid={isPaid}
      />
    </>
  );
};
