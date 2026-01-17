import React, { memo, useMemo } from 'react';
import { SubscriptionStatus } from '../../types';

interface StatusCardProps {
  status: SubscriptionStatus;
  expiresAt?: string;
}

export const StatusCard: React.FC<StatusCardProps> = memo(({ status, expiresAt }) => {
  // Мемоизируем вычисление статуса для избежания пересчета
  const info = useMemo(() => {
    switch (status) {
      case 'active':
        return {
          label: 'Подключено',
          color: 'text-[#F55128]',
          bg: 'bg-[#F55128]/10',
          description: `Активна до ${expiresAt}`,
          cta: 'Подключиться',
        };
      case 'expired':
        return {
          label: 'Подписка истекла',
          color: 'text-red-500',
          bg: 'bg-red-500/10',
          description: 'Продлите подписку для доступа к VPN',
          cta: 'Купить подписку',
        };
      case 'none':
        return {
          label: 'Нет подписки',
          color: 'text-gray-400',
          bg: 'bg-gray-500/10',
          description: 'Начните пользоваться безопасным VPN прямо сейчас',
          cta: 'Начать',
        };
      case 'loading':
      default:
        return {
          label: 'Загрузка...',
          color: 'text-blue-500',
          bg: 'bg-blue-500/10',
          description: 'Получаем данные о подписке',
          cta: null,
        };
    }
  }, [status, expiresAt]);

  return (
    <div data-testid="status-card" className={`p-6 rounded-[16px] ${info.bg} border border-white/5 space-y-4`}>
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${info.color} uppercase tracking-wider`}>
          {info.label}
        </span>
        {status === 'active' && (
          <div className="w-2 h-2 rounded-full bg-[#F55128] animate-pulse" />
        )}
      </div>
      
      <div className="space-y-1">
        <p className="text-white text-base font-medium">{info.description}</p>
      </div>

      {info.cta && (
        <button className="w-full py-4 bg-white text-black rounded-[10px] font-medium active:scale-95 transition-transform">
          {info.cta}
        </button>
      )}
    </div>
  );
});

StatusCard.displayName = 'StatusCard';

