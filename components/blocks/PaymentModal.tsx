'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';
import { useSubscriptionStore } from '@/store/subscription.store';
import { api } from '@/lib/api';
import { getTelegramWebApp } from '@/lib/telegram';
import { logError } from '@/lib/utils/logging';

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
  const [autorenewalEnabled, setAutorenewalEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Загружаем статус автопродления при открытии модалки
  useEffect(() => {
    if (isOpen) {
      loadAutorenewalStatus();
    }
  }, [isOpen]);

  const loadAutorenewalStatus = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAutorenewal();
      setAutorenewalEnabled(data.enabled);
    } catch (error) {
      logError('Failed to load autorenewal status', error, {
        page: 'profile',
        action: 'loadAutorenewalStatus'
      });
      // При ошибке оставляем текущее значение
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAutorenewal = async () => {
    const newValue = !autorenewalEnabled;
    setIsUpdating(true);

    try {
      await api.updateAutorenewal(newValue);
      setAutorenewalEnabled(newValue);
      
      const webApp = getTelegramWebApp();
      if (webApp) {
        webApp.showAlert(
          newValue 
            ? 'Автопродление включено' 
            : 'Автопродление отключено'
        );
      }
    } catch (error) {
      logError('Failed to update autorenewal', error, {
        page: 'profile',
        action: 'updateAutorenewal',
        enabled: newValue
      });
      
      const webApp = getTelegramWebApp();
      if (webApp) {
        webApp.showAlert('Не удалось обновить настройки автопродления. Попробуйте позже.');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Оплата">
      <div className="flex flex-col h-full min-h-0">
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

        {/* 3. Переключатель автопродления */}
        <div 
          className="bg-white/5 rounded-[16px] p-5 border border-white/5 mb-4 css-dialog_content-item"
          style={{ '--index': 3 } as React.CSSProperties}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-medium text-base mb-1">
                Автопродление подписки
              </h3>
              <p className="text-white/60 text-sm">
                {autorenewalEnabled 
                  ? 'Подписка будет продлеваться автоматически' 
                  : 'Подписка не будет продлеваться автоматически'}
              </p>
            </div>
            {isLoading ? (
              <Loader2 size={24} className="animate-spin text-white/40" />
            ) : (
              <button
                onClick={handleToggleAutorenewal}
                disabled={isUpdating}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#F55128]/50 focus:ring-offset-2 focus:ring-offset-[#121212] disabled:opacity-50 disabled:cursor-not-allowed ${
                  autorenewalEnabled ? 'bg-[#F55128]' : 'bg-white/20'
                }`}
                aria-label={autorenewalEnabled ? 'Отключить автопродление' : 'Включить автопродление'}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    autorenewalEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            )}
          </div>
          {isUpdating && (
            <div className="mt-3 flex items-center gap-2 text-white/60 text-sm">
              <Loader2 size={16} className="animate-spin" />
              <span>Обновление...</span>
            </div>
          )}
        </div>

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

