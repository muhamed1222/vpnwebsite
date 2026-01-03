import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SubscriptionStatus } from '../types';
import { apiService } from '../services/apiService';
import { RenewSubscriptionModal } from './RenewSubscriptionModal';

// Форматирование байтов в ГБ
const formatGB = (bytes: number): string => {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1000) return `${(gb / 1000).toFixed(1)} ТБ`;
  if (gb >= 1) return `${gb.toFixed(1)} ГБ`;
  return `${(gb * 1024).toFixed(0)} МБ`;
};

export const BillingPlanCard: React.FC = () => {
  const { subscription } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState({
    usedTraffic: 0,
    dataLimit: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadBilling = async () => {
      setLoading(true);
      try {
        const data = await apiService.getUserStatus();
        if (active && data.ok) {
          setStats({
            usedTraffic: data.usedTraffic,
            dataLimit: data.dataLimit,
          });
        }
      } catch (error) {
        console.error('Ошибка при загрузке биллинга:', error);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadBilling();
    return () => {
      active = false;
    };
  }, [subscription]);

  const isUnlimited = stats.dataLimit === 0;
  const isActive = subscription.status === SubscriptionStatus.ACTIVE;

  return (
    <div className="card-ref flex flex-col mb-6">
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-bold text-fg-4">Ваш тариф</span>
          <span className="text-[13px] text-fg-2 font-medium">
            {isUnlimited ? 'Безлимитный' : 'Стандартный'}
          </span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm font-medium">
            <span className="text-fg-4">Трафик</span>
            <span className="text-fg-2 flex items-center gap-1.5 text-xs">
              {isUnlimited 
                ? (
                  <>
                    <span>Использовано: {formatGB(stats.usedTraffic)}</span>
                    <span className="text-[var(--primary)] font-black text-xl" title="Безлимитно">∞</span>
                  </>
                )
                : `${formatGB(stats.usedTraffic)} / ${formatGB(stats.dataLimit)}`
              }
            </span>
          </div>
          {!isUnlimited && stats.dataLimit > 0 && (
            <div className="w-full h-2 bg-bg-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-fg-4 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((stats.usedTraffic / stats.dataLimit) * 100, 100)}%` }}
              />
            </div>
          )}
        </div>
      </div>
      
      <div className="px-3 py-3 bg-bg-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-b-xl">
        <div className="flex-1">
          {isActive ? (
            <span className="text-xs text-fg-2 font-medium">
              Подписка активна{subscription.activeUntil ? ` до ${subscription.activeUntil}` : ''}
            </span>
          ) : (
            <span className="text-xs text-fg-2 font-medium">
              Подписка неактивна
            </span>
          )}
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--primary-hover)] transition-all"
        >
          Продлить
        </button>
      </div>
      
      <RenewSubscriptionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};
