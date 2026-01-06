'use client';

import React, { useState, useEffect } from 'react';
import { Copy, FolderOpen, Check } from 'lucide-react';
import { getTelegramWebApp } from '@/lib/telegram';
import { BottomSheet } from '../ui/BottomSheet';
import { useUserStore } from '@/store/user.store';
import { api } from '@/lib/api';
import { LoadingSpinner } from '../ui/LoadingSpinner';

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
  const [loading, setLoading] = useState(false);
  const { user } = useUserStore();

  useEffect(() => {
    if (isOpen) {
      const fetchStats = async () => {
        try {
          setLoading(true);
          const data = await api.getReferralStats();
          setStats(data);
        } catch (error) {
          console.error('Failed to fetch referral stats:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchStats();
    }
  }, [isOpen]);

  // Формируем реальную реферальную ссылку
  const botUsername = 'outlivion_bot';
  const referralCode = stats?.referralCode || (user?.id ? `REF${user.id}` : '');
  const referralLink = `https://t.me/${botUsername}?start=${referralCode}`;

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
        console.error('Failed to show alert:', e);
      }
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Реферальная программа">
      <div className="flex flex-col">
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
              <Check size={20} className="text-[#F55128] flex-shrink-0" />
            ) : (
              <Copy size={20} className="text-white/40 group-hover:text-white transition-colors flex-shrink-0" />
            )}
          </div>
        </div>

        {/* 3. Секция истории начислений */}
        <div 
          className="mb-4 css-dialog_content-item"
          style={{ '--index': 3 } as React.CSSProperties}
        >
          <h3 className="text-lg font-medium mb-6 text-white/90">История начислений:</h3>
          <div className="flex flex-col items-center justify-center py-12 text-center bg-white/5 rounded-[16px] border border-dashed border-white/10">
            <div className="bg-white/5 p-4 rounded-xl mb-4 border border-white/5">
              <FolderOpen size={32} className="text-white/20" />
            </div>
            <p className="text-white/40 text-base font-medium">
              Еще нет записей
            </p>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};
