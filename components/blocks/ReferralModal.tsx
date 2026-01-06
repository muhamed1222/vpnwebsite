'use client';

import React, { useState } from 'react';
import { Copy, FolderOpen, Check } from 'lucide-react';
import { getTelegramWebApp } from '@/lib/telegram';
import { BottomSheet } from '../ui/BottomSheet';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReferralModal: React.FC<ReferralModalProps> = ({ isOpen, onClose }) => {
  const [isCopied, setIsCopied] = useState(false);

  /* 
    Обработчик копирования реферальной ссылки.
    При клике ссылка копируется в буфер обмена, иконка меняется на галочку,
    и показывается системное уведомление Telegram.
  */
  const handleCopyLink = () => {
    const link = 'https://t.me/ultimavpnbot/app?s...'; // Замените на реальную ссылку
    navigator.clipboard.writeText(link);
    
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);

    const webApp = getTelegramWebApp();
    if (webApp) {
      webApp.showAlert('Реферальная ссылка скопирована!');
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
          <div className="flex justify-between items-center text-lg font-medium">
            <span className="text-white/60">Друзей приглашено:</span>
            <span className="text-white bg-[#F55128]/20 px-3 py-1 rounded-xl text-[#F55128]">0</span>
          </div>
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
            <code className="text-[#F55128] text-base truncate pr-4">https://t.me/ultimavpnbot/app?s...</code>
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
