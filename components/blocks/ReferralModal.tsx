'use client';

import React, { useState, useEffect } from 'react';
import { DocumentDuplicateIcon as Copy, FolderOpenIcon as FolderOpen, CheckIcon as Check, CalendarIcon as Calendar, CurrencyDollarIcon as Coins } from '@heroicons/react/24/outline';
import { getTelegramWebApp } from '@/lib/telegram';
import { BottomSheet } from '../ui/BottomSheet';
import { useUserStore } from '@/store/user.store';
import { api } from '@/lib/api';
import { config } from '@/lib/config';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { logError } from '@/lib/utils/logging';

interface ReferralHistoryItem {
  id: string;
  amount: number;
  currency: string;
  date: number;
  referralId: string;
  status: 'pending' | 'completed' | 'cancelled';
}

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReferralStats {
  totalCount: number;
  trialCount: number;
  premiumCount: number;
  referralCode: string;
}

export const ReferralModal: React.FC<ReferralModalProps> = ({ isOpen, onClose }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [history, setHistory] = useState<ReferralHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const { user } = useUserStore();

  useEffect(() => {
    if (isOpen) {
      const fetchStats = async () => {
        try {
          setLoading(true);
          const data = await api.getReferralStats();
          setStats(data);
        } catch (error) {
          logError('Failed to fetch referral stats', error, {
            page: 'profile',
            action: 'fetchReferralStats',
            userId: user?.id
          });
        } finally {
          setLoading(false);
        }
      };

      const fetchHistory = async () => {
        try {
          setHistoryLoading(true);
          const data = await api.getReferralHistory();
          setHistory(data || []);
        } catch (error) {
          logError('Failed to fetch referral history', error, {
            page: 'profile',
            action: 'fetchReferralHistory',
            userId: user?.id
          });
          setHistory([]);
        } finally {
          setHistoryLoading(false);
        }
      };

      fetchStats();
      fetchHistory();
    }
  }, [isOpen, user?.id]);

  // Формируем реальную реферальную ссылку
  const referralCode = stats?.referralCode || (user?.id ? `REF${user.id}` : '');
  const referralLink = `https://t.me/${config.bot.username}?start=${referralCode}`;

  /* 
    Обработчик копирования реферальной ссылки.
    При клике ссылка копируется в буфер обмена, иконка меняется на галочку,
    и показывается системное уведомление Telegram.
  */
  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);

    const webApp = getTelegramWebApp();
    if (webApp) {
      try {
        if (typeof webApp.showAlert === 'function') {
          webApp.showAlert('Реферальная ссылка скопирована!');
        }
      } catch (e) {
        logError('Failed to show alert', e, {
          page: 'profile',
          action: 'showAlert',
          userId: user?.id
        });
      }
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Реферальная программа">
      <div className="flex flex-col h-full">
        {/* 1. Инфо-карточка с условиями программы */}
        <div 
          className="bg-white/5 rounded-[16px] p-5 border border-white/5 mb-8 css-dialog_content-item"
          style={{ '--index': 1 } as React.CSSProperties}
        >
          <p className="text-white/90 text-base leading-relaxed mb-4">
            За каждого приглашенного друга вы получите <span className="text-[#F55128] font-medium">15% бонусных дней</span> от всех его пополнений.
          </p>
          <p className="text-white/60 text-sm leading-relaxed mb-6">
            Например, если ваш друг продлит подписку на 1 год, вы получите 55 дней.
          </p>
          
          <div className="h-px bg-white/5 mb-4" />
          
          {loading ? (
            <div className="flex justify-center py-2">
              <LoadingSpinner size="sm" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-base font-medium">
                <span className="text-white/60">Друзей приглашено:</span>
                <span className="text-white bg-[#F55128]/20 px-3 py-1 rounded-xl text-[#F55128]">{stats?.totalCount || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/40">├ С пробной подпиской:</span>
                <span className="text-white/60">{stats?.trialCount || 0} чел.</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/40">└ С премиум подпиской:</span>
                <span className="text-white/60">{stats?.premiumCount || 0} чел.</span>
              </div>
            </div>
          )}
        </div>

        {/* 2. Секция реферальной ссылки */}
        <div 
          className="mb-8 css-dialog_content-item"
          style={{ '--index': 2 } as React.CSSProperties}
        >
          <h3 className="text-lg font-medium mb-4 text-white/90">Ваша реферальная ссылка:</h3>
          <div 
            onClick={handleCopyLink}
            className="bg-black/20 rounded-[10px] p-4 flex items-center justify-between border border-white/5 active:bg-black/40 transition-colors cursor-pointer group"
          >
            <code className="text-[#F55128] text-base truncate pr-4">{referralLink}</code>
            {isCopied ? (
              <Check className="w-5 h-5" className="text-[#F55128] flex-shrink-0" />
            ) : (
              <Copy className="w-5 h-5" className="text-white/40 group-hover:text-white transition-colors flex-shrink-0" />
            )}
          </div>
        </div>

        {/* 3. Секция истории начислений */}
        <div 
          className="mb-4 css-dialog_content-item"
          style={{ '--index': 3 } as React.CSSProperties}
        >
          <h3 className="text-lg font-medium mb-6 text-white/90">История начислений:</h3>
          {historyLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="sm" />
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white/5 rounded-[16px] border border-dashed border-white/10">
              <div className="bg-white/5 p-4 rounded-xl mb-4 border border-white/5">
                <FolderOpen size={32} className="text-white/20" />
              </div>
              <p className="text-white/40 text-sm max-w-[240px]">
                История начислений появится здесь после того, как ваши друзья начнут пополнять подписку
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {history.map((item) => {
                const date = new Date(item.date);
                const formattedDate = date.toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });
                
                const statusColors = {
                  completed: 'text-green-500',
                  pending: 'text-yellow-500',
                  cancelled: 'text-white/40'
                };

                const statusLabels = {
                  completed: 'Завершено',
                  pending: 'Ожидание',
                  cancelled: 'Отменено'
                };

                return (
                  <div
                    key={item.id}
                    className="bg-white/5 rounded-[10px] p-4 border border-white/5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="bg-[#F55128]/10 p-2 rounded-lg border border-[#F55128]/20 flex-shrink-0">
                        <Coins className="w-[18px] h-[18px]" className="text-[#F55128]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium">
                            +{item.amount} {item.currency === 'RUB' ? '₽' : item.currency}
                          </span>
                          <span className={`text-xs ${statusColors[item.status]}`}>
                            {statusLabels[item.status]}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-white/60 text-xs">
                          <Calendar size={12} />
                          <span>{formattedDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
